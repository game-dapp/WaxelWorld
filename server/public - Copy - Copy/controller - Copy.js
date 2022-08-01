const wax = new waxjs.WaxJS({
  rpcEndpoint: 'https://waxtestnet.greymass.com',
  tryAutoLogin: false
});

var loggedIn = false;
var anchorAuth = "owner";

const dapp = "WaxelNinjas";
const endpoint = "testnet.wax.pink.gg";
const contract = "waxelworld11";
const tokenContract = 'waxeltokens1';
const collectionName = 'laxewneftyyy';
const schemaName = 'laxewnefty';
const ninja_arr = ["Human", "Orc", "Demon", "Undead", "Elf"];
const professions_arr = ["Miner","Farmer","Lumberjack","Blacksmith","Carpenter","Tailor","Engineer"];
const work_status = ["Mining","Crafting","Refining"];
let userAccount = "";
let total_matCount = "";
let refined_mat = "";

async function autoLogin() {
  var isAutoLoginAvailable = await wallet_isAutoLoginAvailable();
  if (isAutoLoginAvailable) {
    login();
  }
}

async function wallet_isAutoLoginAvailable() {
  const transport = new AnchorLinkBrowserTransport();
  const anchorLink = new AnchorLink({
    transport,
    chains: [{
      chainId: 'f16b1833c747c43682f4386fca9cbb327929334a762755ebec17f6f23c9b8a12',
      nodeUrl: 'https://waxtestnet.greymass.com',
    }],
  });
  var sessionList = await anchorLink.listSessions(dapp);
  if (sessionList && sessionList.length > 0) {
    useAnchor = true;
    return true;
  } else {
    useAnchor = false;
    return await wax.isAutoLoginAvailable();
  }
}

async function selectWallet(walletType) {
  wallet_selectWallet(walletType);
  login();
}

async function wallet_selectWallet(walletType) {
  useAnchor = walletType == "anchor";
}

async function login() {
  try {
    userAccount = await wallet_login();
    sendUserData();
  } catch (e) {
    unityInstance.SendMessage("ErrorHandler", "Client_SetErrorData", e.message);
  }
}

async function wallet_login() {
  const transport = new AnchorLinkBrowserTransport();
  const anchorLink = new AnchorLink({
    transport,
    chains: [{
      chainId: 'f16b1833c747c43682f4386fca9cbb327929334a762755ebec17f6f23c9b8a12',
      nodeUrl: 'https://waxtestnet.greymass.com',
    }],
  });
  if (useAnchor) {
    var sessionList = await anchorLink.listSessions(dapp);
    if (sessionList && sessionList.length > 0) {
      wallet_session = await anchorLink.restoreSession(dapp);
    } else {
      wallet_session = (await anchorLink.login(dapp)).session;
    }
    wallet_userAccount = String(wallet_session.auth).split("@")[0];
    auth = String(wallet_session.auth).split("@")[1];
    anchorAuth = auth;
  } else {
    wallet_userAccount = await wax.login();
    wallet_session = wax.api;
    anchorAuth = "active";
  }
  return wallet_userAccount;
}

async function wallet_transact(actions) {
  if (useAnchor) {
    var result = await wallet_session.transact({
      actions: actions
    }, {
      blocksBehind: 3,
      expireSeconds: 30
    });
    result = {
      transaction_id: result.processed.id
    };
  } else {
    var result = await wallet_session.transact({
      actions: actions
    }, {
      blocksBehind: 3,
      expireSeconds: 30
    });
  }
  return result;
}

async function fetchingData() {
  let status = "true";
  unityInstance.SendMessage(
    "GameController",
    "Client_SetFetchingData",
    status
  );
}

async function sendUserData() {
  try {

    unityInstance.SendMessage(
      "GameController",
      "Client_SetFetchingData",
      "true"
    );

    userData = await getUserData();

    inventory = await getUserInventoryData(userData.mat_inventory);

    nft_count = await getNftCount(userData.nft_counts);

    ninjaData = await getNinjaData();

    settlementData = await getSettlementData();

    professionData = await getProfessionData();

    itemData = await getItemsData();

    assetData = await getAssets("all");

    configData = await getConfigData();

    dropData = await getDrop();
    let obj = {
      account: userAccount.toString(),
      ninjas: ninjaData,
      professions: professionData,
      items: itemData,
      citizens: typeof userData.citizen_count !== 'undefined'?userData.citizen_count:0,
      inventory: inventory,
      assets: assetData,
      nft_count: nft_count,
      config: configData,
      drop: dropData,
      settlements: settlementData,
      total_matCount: total_matCount
    }

    console.log(obj);

    unityInstance.SendMessage(
      "GameController",
      "Client_SetUserData",
      obj === undefined ? JSON.stringify({}) : JSON.stringify(obj)
    );

  } catch (e) {
    console.log(e);
    unityInstance.SendMessage("ErrorHandler", "Client_SetErrorData", e.message);
  }
}


async function getAssets(schema) {

  try {
    if (schema == "all") {
      var path = "atomicassets/v1/assets?collection_name=" + collectionName + "&owner=" + userAccount + "&page=1&limit=1000&order=desc&sort=asset_id";
      const response = await fetch("https://" + "test.wax.api.atomicassets.io/" + path, {
        headers: {
          "Content-Type": "text/plain"
        },
        method: "POST",
      });

      const body = await response.json();
      const data = Object.values(body.data);
      var obj = [];
      for (const asset of data) {
        obj.push({
          asset_id: asset.asset_id,
          img: asset.template.immutable_data.img,
          name: asset.template.immutable_data.name,
          schema: asset.schema.schema_name
        });
      }
      return obj;
    } else {
      var path = "atomicassets/v1/assets?collection_name=" + collectionName + "&schema_name=" + schema + "&owner=" + userAccount + "&page=1&limit=1000&order=desc&sort=asset_id";
      const response = await fetch("https://" + "test.wax.api.atomicassets.io/" + path, {
        headers: {
          "Content-Type": "text/plain"
        },
        method: "POST",
      });

      const body = await response.json();
      return body.data;
    }
  } catch (e) {
    unityInstance.SendMessage("ErrorHandler", "Client_SetErrorData", e.message);
  }
}

const getDrop = async function () {
  var path = "/v1/chain/get_table_rows";

  var data = JSON.stringify({
    json: true,
    code: "neftyblocksd",
    scope: "neftyblocksd",
    table: "drops",
    limit: 1,
    lower_bound: "29449",
    upper_bound: "29449",
  });

  const response = await fetch("https://" + "wax.pink.gg" + path, {
    headers: {
      "Content-Type": "text/plain"
    },
    body: data,
    method: "POST",
  });

  const body = await response.json();
  let dropLink = "";
  if (body.rows.length != 0) {
    if (parseInt(body.rows[0].current_claimed) >= parseInt(body.rows[0].max_claimable)) {
      dropLink = "https://wax.atomichub.io/market?collection_name=waxelninjas1&order=asc&schema_name=waxel.ninjas&sort=price&symbol=WAX";
    } else
      dropLink = "https://neftyblocks.com/c/waxelninjas1/drops/29449";
  }
  return dropLink;
}

async function getUserData() {
  var path = "/v1/chain/get_table_rows";

  var data = JSON.stringify({
    json: true,
    code: contract,
    scope: contract,
    table: "user",
    limit: 1,
    lower_bound: userAccount,
    upper_bound: userAccount,
  });

  const response = await fetch("https://" + endpoint + path, {
    headers: {
      "Content-Type": "text/plain"
    },
    body: data,
    method: "POST",
  });

  const body = await response.json();
  if (body.rows.length != 0)
    return body.rows[0];
  else return 0;
}

async function getUserInventoryData(data) {
  inv_obj = [];
  let total_count = 0;
  if (data) {
    for (i = 0; i < data.length; i++) {
      inv = data[i].split(" ");
      total_count += parseFloat(inv[0]);
      inv_obj.push({
        count: inv[0],
        name: inv[1]
      });
    }
  }
  total_matCount = total_count;
  return inv_obj;
}

const getNftCount = async (userdata) => {
  nft_count = [];
  if (userdata) {
    nft_count.push({
      count: userdata.maxNinja,
      name: "Max Ninja"
    })
    const maxProfess = Object.values(userdata.maxProfessions);
    for (const data of maxProfess) {
      nft_count.push({
        count: data.value,
        name: data.key
      })
    }
  }
  return nft_count;
}

async function getAssetD() {
  try {

    let assets = getAssets();
    assetdata = await assets;

    console.log(assetdata);

    unityInstance.SendMessage(
      "GameController",
      "Client_SetAssetData",
      assetdata === undefined ? JSON.stringify({}) : JSON.stringify(assetdata)
    );
  } catch (e) {
    unityInstance.SendMessage("ErrorHandler", "Client_SetErrorData", e.message);
  }
}

async function getNinjaData() {
  try {

    let assets = getAssets("laxewnefty");
    assetData = await assets;

    var ninja_data = [];

    const arr = Object.values(assetData);
    if (arr.length != 0) {
      const check_data = await checkAssetIds("ninjas");
      if (typeof check_data !== 'undefined') {
        const check_ids = check_data[0];
        for (const asset of arr) {
          if (check_ids.includes(asset.asset_id)) {
            const check_body_data = check_data[1];
            for (const bodyData of check_body_data) {
              if (bodyData.id == asset.asset_id) {
                ninja_data.push({
                  asset_id: asset.asset_id,
                  delay_seconds: bodyData.delay_seconds,
                  last_search: bodyData.last_search,
                  race: asset.name,
                  img: asset.data.img,
                  status: bodyData.status,
                  reg: "1"
                });
              }
            }
          } else {
            ninja_data.push({
              asset_id: asset.asset_id,
              delay_seconds: "",
              last_search: "",
              race: asset.name,
              img: asset.data.img,
              status: "",
              reg: "0"
            });
          }
        }
      }
      else {
        for (const asset of arr ){
          ninja_data.push({
            asset_id: asset.asset_id,
            delay_seconds: "",
            last_search: "",
            race: asset.name,
            img: asset.data.img,
            status: "",
            reg: "0"
          });
        }
      }
    }
    console.log(ninja_data);
    return ninja_data;
  } catch (e) {
    console.log(e);
    unityInstance.SendMessage("ErrorHandler", "Client_SetErrorData", e.message);
  }
}

const getSettlementData = async () => {
  try {
    const assetData = await getAssets("upgrades");
    const arr = Object.values(assetData);
    const settlements = [];
    const check_data = await checkAssetIds("settlements");
    const ids = check_data[0];
    const body_data = check_data[1];
    console.log(arr);
    console.log(ids);
    console.log(body_data);
    if(typeof ids != 'undefined' && typeof ids != 'undefined'){
        for(const data of body_data){
            settlements.push({
              asset_id: data.id,
              name: data.name,
              reg: "1",
            });
        }
    }
    if (arr.length !== 0) {
        for (const asset of arr) {
            settlements.push({
              asset_id: asset.asset_id,
              name: asset.name,
              img: asset.data.img,
              reg: "0",
            });
          }
        }
    return settlements;
  } catch (e) {
    console.log(e);
    unityInstance.SendMessage("ErrorHandler", "Client_SetErrorData", e.message);
  }
}

const getConfigData = async () => {
  try {
    var path = "/v1/chain/get_table_rows";
    var data = JSON.stringify({
      json: true,
      code: contract,
      scope: contract,
      table: "configs",
      limit: 1
    });
    const response = await fetch("https://" + endpoint + path, {
      headers: {
        "Content-Type": "text/plain"
      },
      body: data,
      method: "POST",
    });

    const body = await response.json();
    if (body.rows.length === 0) return "";
    else {
      return body.rows[0];
    }
  } catch (e) {
    unityInstance.SendMessage("ErrorHandler", "Client_SetErrorData", e.message);
  }
}

const checkAssetIds = async (table) => {
  try {
    var path = "/v1/chain/get_table_rows";
    var data = JSON.stringify({
      json: true,
      code: contract,
      scope: contract,
      table: table,
      key_type: `i64`,
      index_position: 2,
      lower_bound: eosjsName.nameToUint64(wallet_userAccount),
      limit: 1000,
    });
    const response = await fetch("https://" + endpoint + path, {
      headers: {
        "Content-Type": "text/plain"
      },
      body: data,
      method: "POST",
    });

    const body = await response.json();
    const arr = Object.values(body.rows);
    const ids = [];
    const table_data = [];
    if (arr.length != 0) {
      for (const data of arr) {
        ids.push(data.asset_id);
        if (table == "ninjas") {
          table_data.push({
            id: data.asset_id,
            delay_seconds: data.delay_seconds,
            last_search: data.last_search,
            status: data.status,
          });
        } else if (table == "professions") {
          table_data.push({
            id: data.asset_id,
            type: data.type,
            last_material_search: data.last_material_search,
            uses_left: data.uses_left,
            items: data.items,
            status: data.status
          });
        } else if (table == "items") {
          table_data.push({
            id: data.asset_id,
            profession: data.profession,
            function_name: data.function.key,
            function_value: data.function.value,
            equipped: data.equipped,
            last_material_search: data.last_material_search,
            uses_left: data.uses_left,
            status: data.status
          });
        }
        else if (table == "settlements") {
          table_data.push({
            id:data.asset_id,
            name: data.type
          });
      }
    }
    }
    return [ids, table_data];
  } catch (e) {

  }
}

async function getProfessionData() {
  try {

    let assetData = await getAssets("professions");
    var profession_data = [];

    const arr = Object.values(assetData);
    if (arr.length !== 0) {
      const check_data = await checkAssetIds("professions");
      if (typeof check_data !== 'undefined') {
        const check_ids = check_data[0];
        for (const asset of arr) {
          if (check_ids.includes(asset.asset_id)) {
            const check_body_data = check_data[1];
            for (const bodyData of check_body_data) {
              if (bodyData.id == asset.asset_id) {
                profession_data.push({
                  asset_id: asset.asset_id,
                  type: bodyData.type,
                  name: asset.name,
                  last_material_search: bodyData.last_material_search,
                  uses_left: bodyData.uses_left,
                  items: bodyData.items,
                  status: bodyData.status,
                  img: asset.data.img,
                  reg: "1",
                });
              }
            }
          } else {
            profession_data.push({
              asset_id: asset.asset_id,
              type: "",
              name: asset.name,
              last_material_search: "",
              uses_left: "",
              items: "",
              status: "",
              img: asset.data.img,
              reg: "0",
            });
          }
        }
      }
      else {
        for (const asset of arr){
          profession_data.push({
            asset_id: asset.asset_id,
            type: "",
            name: asset.name,
            last_material_search: "",
            uses_left: "",
            items: "",
            status: "",
            img: asset.data.img,
            reg: "0",
          });
        }
      }
    }

    return profession_data;
  } catch (e) {
    console.log(e);
    unityInstance.SendMessage("ErrorHandler", "Client_SetErrorData", e.message);
  }
}

async function getItemsData() {
  try {

    let assetData = await getAssets("items");
    const item_data = [];
    const arr = Object.values(assetData);
    if (arr.length !== 0) {
      const check_data = await checkAssetIds("items");
      if (typeof check_data !== 'undefined') {
        const check_ids = check_data[0];
        console.log(check_data[1]);
        for (const asset of arr) {
          if (check_ids.includes(asset.asset_id)) {
            const check_body_data = check_data[1];
            for (const bodyData of check_body_data) {
              if (bodyData.id == asset.asset_id) {
                item_data.push({
                  asset_id: asset.asset_id,
                  name: asset.name,
                  profession: bodyData.profession,
                  function_name: bodyData.function_name,
                  function_value: bodyData.function_value,
                  equipped: bodyData.equipped,
                  last_material_search: bodyData.last_material_search,
                  uses_left: bodyData.uses_left,
                  status: bodyData.status,
                  img: asset.data.img
                });
              }
            }
          } else {
            item_data.push({
              asset_id: asset.asset_id,
              name: asset.name,
              profession: "",
              function_name: "",
              function_value: "",
              equipped: "0",
              last_material_search: "",
              uses_left: "",
              status: "",
              img: asset.data.img
            });
          }
        }
      }
      else {
        for (const asset of arr){
          item_data.push({
            asset_id: asset.asset_id,
            name: asset.name,
            profession: "",
            function_name: "",
            function_value: "",
            equipped: "",
            last_material_search: "",
            uses_left: "",
            status: "",
            img: asset.data.img,
            reg: "0"
          });
        }
      }
    }
    return item_data;
  } catch (e) {
    console.log(e);
    unityInstance.SendMessage("ErrorHandler", "Client_SetErrorData", e.message);
  }
}

async function getNinjaD() {
  try {
    let ninjadata = await getNinjaData();
    unityInstance.SendMessage(
      "GameController",
      "Client_SetNinjaData",
      ninjadata === undefined ? JSON.stringify({}) : JSON.stringify(ninjadata)
    );
  } catch (e) {
    unityInstance.SendMessage("ErrorHandler", "Client_SetErrorData", e);
  }
}

async function getProfessionD() {
  try {
    let professiondata = await getProfessionData();
    unityInstance.SendMessage(
      "GameController",
      "Client_SetProfessionData",
      professiondata === undefined ? JSON.stringify({}) : JSON.stringify(professiondata)
    );
  } catch (e) {
    unityInstance.SendMessage("ErrorHandler", "Client_SetErrorData", e);
  }
}

const getItemD = async() => {
  try{
    let item_data_updated = await getItemsData();
    unityInstance.SendMessage(
      "GameController",
      "Client_SetItemData",
      item_data_updated === undefined ? JSON.stringify({}) : JSON.stringify(item_data_updated)
    );
  }
  catch(e){
    unityInstance.SendMessage("ErrorHandler", "Client_SetErrorData", e);
  }

}

async function getSearchD(table,assetid) {
  try {
    var path = "/v1/chain/get_table_rows";
    var data = JSON.stringify({
      json: true,
      code: contract,
      scope: contract,
      table: table,
      limit: 1,
      lower_bound: assetid,
      upper_bound: assetid
    });
    const response = await fetch("https://" + endpoint + path, {
      headers: {
        "Content-Type": "text/plain"
      },
      body: data,
      method: "POST",
    });

    const body = await response.json();
    const search_data = [];
    if (body.rows.length != 0) {
      let status = body.rows[0].status;
      if (status == "holdup") {
        getSearchD(assetid);
      } else if (status != "holdup") {
        if(ninja_arr.includes(body.rows[0].race)){
          search_data.push({
            name: body.rows[0].race,
            status: body.rows[0].status,
            totalCitizensCount: userData.citizen_count
          });
        }
        else if(professions_arr.includes(body.rows[0].name)){
          if(work_status.includes(body.rows[0].status))
          {
            search_data.push({
              name: body.rows[0].name,
              status: body.rows[0].status,
            });
          }
          else {
            console.log(body.rows[0])
            if(body.rows[0].type == "Gatherer"){
              let inv = [];
              inv = body.rows[0].status.split(" ");
                mat_name = inv[3].match(/[a-zA-Z]+/g);
                count = inv[3].match(/\d+/g)/100;
                search_data.push({
                  name: body.rows[0].name,
                  status: "",
                  matFound: "true",
                  matName: mat_name[0],
                  matCount: count,
                  totalMatCount: (parseFloat(total_matCount) + parseFloat(count)).toString()
                });
              }
              else if(body.rows[0].type == "Refiner and crafter"){
                search_data.push({
                  name: body.rows[0].name,
                  status: "",
                  matFound: "false",
                  matRefined: "true",
                  matName: refined_mat,
                  totalMatCount: (parseFloat(total_matCount) - 2).toString()
                });
              }
            }
          }
        }
      }
    console.log(search_data);
    unityInstance.SendMessage(
      "GameController",
      "Client_SetCallBackData",
      search_data === undefined ? JSON.stringify({}) : JSON.stringify(search_data)
    );
  } catch (e) {
    unityInstance.SendMessage("ErrorHandler", "Client_SetErrorData", e);
  }
}

async function start_search(assetid) {
  try {
    assetId = String(assetid).split("#")[1];
    const result = await wallet_transact([{
      account: contract,
      name: "startsearch",
      authorization: [{
        actor: wallet_userAccount,
        permission: anchorAuth
      }],
      data: {
        account: wallet_userAccount,
        assetID: assetId,
      },
    }, ]);
    await getNinjaD();
    await getNinjaSearchD(assetid);
  } catch (e) {
    unityInstance.SendMessage("ErrorHandler", "Client_SetErrorData", e);
  }
}

async function search_citizen(assetId, type,asset_type) {
  try {
    console.log(assetId);
    const result = type == "1" ? await wallet_transact([{
      account: contract,
      name: "startsearch",
      authorization: [{
        actor: wallet_userAccount,
        permission: anchorAuth
      }],
      data: {
        account: wallet_userAccount,
        assetID: assetId,
      },
    }, ]) : await wallet_transact([{
      account: contract,
      name: "searchforcz",
      authorization: [{
        actor: wallet_userAccount,
        permission: anchorAuth
      }],
      data: {
        account: wallet_userAccount,
        assetID: assetId,
      },
    }, ]);
    await delay(4000);
    if(ninja_arr.includes(asset_type)){
      await getNinjaD();
      await getSearchD("ninjas",assetId);
    }
    else if(professions_arr.includes(asset_type)){
      await getProfessionD();
      await getSearchD("professions",assetId);
    }
    
  } catch (e) {
    console.log(e);
    unityInstance.SendMessage("ErrorHandler", "Client_SetErrorData", e.message);
  }
}

const delay = async (delayInms) => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(2);
    }, delayInms);
  });
}

const unregisterAsset = async function (assetid, race) {
  try {
    const result = await wallet_transact([{
      account: contract,
      name: "unbindnfts",
      authorization: [{
        actor: wallet_userAccount,
        permission: anchorAuth
      }],
      data: {
        owner: wallet_userAccount,
        asset_ids: [assetid]
      },
    }, ]);
    if (ninja_arr.includes(race)) {
      await delay(2000);
      await getNinjaD();
    }
    else if(professions_arr.includes(race)){
      await delay(2000);
      await getProfessionD();
    }
    let unregister_callBack = [];
    unregister_callBack.push({
      name: race,
      status: "De-Registered Successfully"});

      unityInstance.SendMessage(
        "GameController",
        "Client_SetCallBackData",
        unregister_callBack === undefined ? JSON.stringify({}) : JSON.stringify(unregister_callBack)
      );
  } catch (e) {
    unityInstance.SendMessage("ErrorHandler", "Client_SetErrorData", e.message);
  }
}

async function registerAsset(assetid, race) {
  try {
    console.log(race);
    const result = await wallet_transact([{
      account: contract,
      name: "registernfts",
      authorization: [{
        actor: wallet_userAccount,
        permission: anchorAuth
      }],
      data: {
        asset_ids: [assetid],
        owner: wallet_userAccount
      },
    }, ]);
    if (ninja_arr.includes(race)) {
      await delay(2000);
      await getNinjaD();
    }
    else if(professions_arr.includes(race)){
      await delay(2000);
      await getProfessionD();
    }
    let register_callBack = [];
    register_callBack.push({
      name: race,
      status: "Registered Successfully"
    })
    unityInstance.SendMessage(
      "GameController",
      "Client_SetCallBackData",
      register_callBack === undefined ? JSON.stringify({}) : JSON.stringify(register_callBack)
    );
  } catch (e) {
    unityInstance.SendMessage("ErrorHandler", "Client_SetErrorData", e.message);
  }
}

const mintcitizens = async () => {
  try {
    const result = await wallet_transact([{
      account: contract,
      name: "mintcitizens",
      authorization: [{
        actor: wallet_userAccount,
        permission: anchorAuth
      }],
      data: {
        account: wallet_userAccount,
        amount: 1
      },
    }, ]);
    await result;
    let arr;
    result.transaction_id ? arr = "Mint" : "";
    unityInstance.SendMessage(
      "GameController",
      "Client_TrxHash",
      result === undefined ? "" : arr
    );
  } catch (e) {
    unityInstance.SendMessage("ErrorHandler", "Client_SetErrorData", e.message);
  }
}

const burncitizennft = async () => {
  try {
    const result = await wallet_transact([{
      account: contract,
      name: "mintcitizens",
      authorization: [{
        actor: wallet_userAccount,
        permission: anchorAuth
      }],
      data: {
        account: wallet_userAccount,
        amount: 1
      },
    }, ]);
    await result;
    let arr;
    result.transaction_id ? arr = "Burn" : "";
    unityInstance.SendMessage(
      "GameController",
      "Client_TrxHash",
      result === undefined ? "" : arr
    );
  } catch (e) {
    unityInstance.SendMessage("ErrorHandler", "Client_SetErrorData", e.message);
  }
}

const transfer = async (asset_id, memo) => {
  try {
    const result = await wallet_transact([{
      account: "atomicassets",
      name: "transfer",
      authorization: [{
        actor: wallet_userAccount,
        permission: anchorAuth
      }],
      data: {
        from: wallet_userAccount,
        to: contract,
        asset_ids: [asset_id],
        memo: memo
      },
    }, ]);
    await delay(2000);
    if(memo == "regupgrade"){
      settlements_data = await getSettlementData();
      console.log(settlements_data);
      unityInstance.SendMessage(
        "GameController",
        "Client_SetSettlementData",
        settlements_data === undefined ? JSON.stringify({}) : JSON.stringify(settlements_data)
      );
      let callBack = [];
      callBack.push({
      name: "Camp",
      status: "Registered Successfully"
      });
      unityInstance.SendMessage(
        "GameController",
        "Client_SetCallBackData",
        callBack === undefined ? JSON.stringify({}) : JSON.stringify(callBack)
      );
    }
  } catch (e) {
    unityInstance.SendMessage("ErrorHandler", "Client_SetErrorData", e.message);
  }
}

const equipItems = async(p_id,asset_id) => {
  try{
    const result = await wallet_transact([{
      account: contract,
      name: "findmat",
      authorization: [{
        actor: wallet_userAccount,
        permission: anchorAuth
      }],
      data: {
        assetID: asset_id,
        account: wallet_userAccount
      },
    }, ]);
  }
  catch(e){
    unityInstance.SendMessage("ErrorHandler", "Client_SetErrorData", e.message);
  }
}

const unequipItems = async(asset_id,mat_name) =>{
  try{
    const result = await wallet_transact([{
      account: contract,
      name: "unequipitems",
      authorization: [{
        actor: wallet_userAccount,
        permission: anchorAuth
      }],
      data: {
        item_ids: [asset_id],
        account: wallet_userAccount
      },
    }, ]);
    item_data_updated = await getItemD();
    let unequip_callBack = [];
    unregister_callBack.push({
      name: mat_name,
      status: "De-Equiped Successfully"});

      unityInstance.SendMessage(
        "GameController",
        "Client_SetCallBackData",
        unequip_callBack === undefined ? JSON.stringify({}) : JSON.stringify(unequip_callBack)
      );
  }
  catch(e){
    unityInstance.SendMessage("ErrorHandler", "Client_SetErrorData", e.message);
  }
}

const withdraw_asset = async(asset_id) =>{
  try{
    const result = await wallet_transact([{
      account: contract,
      name: "withdrawnfts",
      authorization: [{
        actor: wallet_userAccount,
        permission: anchorAuth
      }],
      data: {
        asset_ids: [asset_id],
        account: wallet_userAccount
      },
    }, ]);
    await delay(2000);
    settlements_data = await getSettlementData();
      unityInstance.SendMessage(
        "GameController",
        "Client_SetSettlementData",
        settlements_data === undefined ? JSON.stringify({}) : JSON.stringify(settlements_data)
      );
      let callBack = [];
      callBack.push({
      name: "Camp",
      status: "De-Registered Successfully"
      });
      unityInstance.SendMessage(
        "GameController",
        "Client_SetCallBackData",
        callBack === undefined ? JSON.stringify({}) : JSON.stringify(callBack)
      );
  }
  catch(e)
  {
    unityInstance.SendMessage("ErrorHandler", "Client_SetErrorData", e.message);
  }
}

const find_mat = async (asset_id) => {
  try{
    const result = await wallet_transact([{
      account: contract,
      name: "findmat",
      authorization: [{
        actor: wallet_userAccount,
        permission: anchorAuth
      }],
      data: {
        assetID: asset_id,
        account: wallet_userAccount
      },
    }, ]);
    await delay(3600);
    console.log(result);
    await getProfessionD();
    await getSearchD("professions",asset_id)
  }
  catch(e){
    unityInstance.SendMessage("ErrorHandler", "Client_SetErrorData", e.message);
  }
}

const mat_refine = async (p_asset_id,mat_name) => {
  try{
    const result = await wallet_transact([{
      account: contract,
      name: "refinemat",
      authorization: [{
        actor: wallet_userAccount,
        permission: anchorAuth
      }],
      data: {
        professID: p_asset_id,
        account: wallet_userAccount,
        mat: mat_name
      },
    }, ]);
    refined_mat = mat_name;
    await delay(3600);
    console.log(result);
    await getProfessionD();
    await getSearchD("professions",asset_id)
  }
  catch(e){
    unityInstance.SendMessage("ErrorHandler", "Client_SetErrorData", e.message);
  }
}
