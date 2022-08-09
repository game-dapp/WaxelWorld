//import axios from 'axios';

//const { response } = require("express");

const wax = new waxjs.WaxJS({
  rpcEndpoint: 'https://waxtestnet.greymass.com',
  tryAutoLogin: false
});

var loggedIn = false;
var anchorAuth = "owner";

const dapp = "WaxelNinjas";
const endpoint = "testnet.wax.pink.gg";
const contract = "waxelowner12";
// const contract = "waxelworld11";
// const tokenContract = 'waxeltokens1';
const collectionName = 'laxewneftyyy';
const schemaName = 'laxewnefty';
const ninja_arr = ["Human", "Orc", "Demon", "Undead", "Elf"];
const professions_arr = ["Miner", "Farmer", "Lumberjack", "Blacksmith", "Carpenter", "Tailor", "Engineer"];
const work_status = ["Mining", "Crafting", "Refining"];
let configData = "";
let userAccount = "";
let total_matCount = "";
let refined_mat = "";
let function_call_count = 0;
const citizens_pack = [];
let userData = "";

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
    configData = await getConfigData();
    itemData = await getItemsData(configData[0]);
    assetData = await getAssets("all");
    await getCitizensPack(assetData);
    dropData = await getDrop();
    let obj = {
      account: userAccount.toString(),
      ninjas: ninjaData,
      professions: professionData,
      items: itemData,
      citizens: typeof userData.citizen_count !== 'undefined' ? userData.citizen_count : 0,
      citizens_pack_count: citizens_pack.length,
      inventory: inventory,
      assets: assetData,
      nft_count: nft_count,
      config: configData[0],
      drop: dropData,
      settlements: settlementData,
      total_matCount: total_matCount,
      craft_combos: configData[1]
    }
    console.log(obj)
    unityInstance.SendMessage(
      "GameController",
      "Client_SetLoginData",
      obj === undefined ? JSON.stringify({}) : JSON.stringify(obj)
    );

  } catch (e) {
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
          schema: asset.schema.schema_name,
          template: asset.template.template_id
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
        count: parseInt(inv[0]).toString(),
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
    console.log('getNinjaData')
    assetData = await assets;
    console.log(assetData)

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
                  mint_id: asset.template_mint,
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
              mint_id: asset.template_mint,
              delay_seconds: "",
              last_search: "",
              race: asset.name,
              img: asset.data.img,
              status: "",
              reg: "0"
            });
          }
        }
      } else {
        for (const asset of arr) {
          ninja_data.push({
            asset_id: asset.asset_id,
            mint_id: asset.template_mint,
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
    return ninja_data;
  } catch (e) {
    unityInstance.SendMessage("ErrorHandler", "Client_SetErrorData", e.message);
  }
}

const getSettlementData = async () => {
  try {
    const assetData = await getAssets("upgrades"); //gets the camp in the account.
    const arr = Object.values(assetData);
    const settlements = [];
    const check_data = await checkAssetIds("settlements"); // gets the camp in the contract
    const ids = check_data[0];
    const body_data = check_data[1];
    if (typeof ids != 'undefined' && typeof ids != 'undefined') {
      for (const data of body_data) {
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
    const temp_data = Object.values(await GetTemplateData());
    let combos = [];
    if (body.rows.length === 0) return "";
    else {
      const cData = Object.values(body.rows[0].item_combo);
      for (const combo_data of cData) {
        let ingredient_combo = [];
        for (const combo of Object.values(combo_data.ingredients)) {
          let inv = combo.split(" ");
          ingredient_combo.push({
            key: inv[1],
            value: parseInt(inv[0]).toString()
          });
        }
        for (const t_data of temp_data) {
          if (t_data.template_id == combo_data.template_id) {
            let inv = t_data.name.split(" ");
            let name = [];
            for (let j = 1; j < inv.length; j++) {
              name.push(inv[j]);
            }
            combos.push({
              item_name: name.join(' '),
              rarity: t_data.rarity,
              template_id: combo_data.template_id,
              type: combo_data.type,
              delay: combo_data.delay,
              ingredients: ingredient_combo
            });
            break;
          }
        }
      }
      return [body.rows[0], combos];
    }
  } catch (e) {
    unityInstance.SendMessage("ErrorHandler", "Client_SetErrorData", e.message);
  }
}

const GetTemplateData = async () => {
  var path = "atomicassets/v1/templates?collection_name=" + collectionName + "&schema_name=items&page=1&limit=1000&order=desc&sort=created";
  const response = await fetch("https://" + "test.wax.api.atomicassets.io/" + path, {
    headers: {
      "Content-Type": "text/plain"
    },
    method: "POST",
  });

  const body = await response.json();
  const data = [];
  for (const t_data of body.data) {
    data.push({
      template_id: t_data.template_id,
      name: t_data.immutable_data.name,
      rarity: t_data.immutable_data.Rarity
    });
  }
  return data;
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
    console.log(arr)
    console.log('here is contrat data of ' + table)
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
        } else if (table == "settlements") {
          if (userAccount == data.owner){
            table_data.push({
              id: data.asset_id,
              name: data.type
            });
          }
         
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
      } else {
        for (const asset of arr) {
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
    unityInstance.SendMessage("ErrorHandler", "Client_SetErrorData", e.message);
  }
}

async function getItemsData(config) {
  try {

    let assetData = await getAssets("items");
    const item_data = [];
    const arr = Object.values(assetData);
    if (arr.length !== 0) {
      const check_data = await checkAssetIds("items");
      if (typeof check_data !== 'undefined') {
        const check_ids = check_data[0];
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
                  function_value: (parseFloat(bodyData.function_value).toFixed(2)).toString(),
                  equipped: bodyData.equipped,
                  last_material_search: bodyData.last_material_search,
                  uses_left: bodyData.uses_left,
                  status: bodyData.status,
                  img: asset.data.img
                });
              }
            }
          } else {
            let rarity = asset.template.immutable_data.Rarity;
            let function_value;
            if (rarity == "Rare")
              function_value = "15.00";
            else if (rarity == "Uncommon")
              function_value = "10.00";
            else
              function_value = "5.00";
            const config_data = Object.values(config.item_combo);
            for (const data of config_data) {
              if (asset.template.template_id == data.template_id) {
                item_data.push({
                  asset_id: asset.asset_id,
                  name: asset.name,
                  profession: "",
                  function_name: data.type,
                  function_value: function_value,
                  equipped: "0",
                  last_material_search: "",
                  uses_left: "60",
                  status: "",
                  img: asset.data.img
                });
                break;
              }
            }
          }
        }
      } else {
        for (const asset of arr) {
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
    unityInstance.SendMessage("ErrorHandler", "Client_SetErrorData", e.message);
  }
}

const getCitizensPack = async (assets) => {
  try {
    const data = Object.values(assets);
    for (const asset of data) {
      if (asset.name == "Citizens - 10x" && asset.schema == "citizens")
        citizens_pack.push(asset.asset_id);
    }
  } catch (e) {
    unityInstance.SendMessage("ErrorHandler", "Client_SetErrorData", e.message);
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
    unityInstance.SendMessage("ErrorHandler", "Client_SetErrorData", e.message);
  }
}

const getItemD = async () => {
  try {
    item_data_updated = await getItemsData(configData[0]);
    unityInstance.SendMessage(
      "GameController",
      "Client_SetItemData",
      item_data_updated === undefined ? JSON.stringify({}) : JSON.stringify(item_data_updated)
    );
  } catch (e) {
    unityInstance.SendMessage("ErrorHandler", "Client_SetErrorData", e.message);
  }

}

async function getSearchD(table, assetid, action_type) {
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
      if (body.rows[0].status == "holdup") {
        await delay(2000);
        function_call_count++;
        if (function_call_count < 4) getSearchD(table, assetid, action_type);
        else {
          let callBack = [];
          callBack.push({
            name: body.rows[0].name,
            status: "RNG Failed"
          });
          unityInstance.SendMessage(
            "GameController",
            "Client_SetCallBackData",
            callBack === undefined ? JSON.stringify({}) : JSON.stringify(callBack)
          );
        }
      } else if (body.rows[0].status != "holdup") {
        if (ninja_arr.includes(body.rows[0].race)) {
          search_data.push({
            name: body.rows[0].race,
            status: body.rows[0].status,
            totalCitizensCount: (await getUserData()).citizen_count
          });
        } else if (professions_arr.includes(body.rows[0].name)) {
          if (body.rows[0].type == "Gatherer") {
            switch (action_type) {
              case ("start_mat_find"):
                search_data.push({
                  name: body.rows[0].name,
                  status: body.rows[0].status,
                  asset_id: body.rows[0].asset_id,
                  matFound: "false",
                  matRefined: "false",
                  totalMatCount: total_matCount,
                });
                break;
              case ("find_mat"):
                let inv = [];
                inv = body.rows[0].status.split(" ");
                mat_name = inv[3].match(/[a-zA-Z]+/g);
                count = inv[3].match(/\d+/g) / 100;
                search_data.push({
                  name: body.rows[0].name,
                  status: "",
                  matFound: "true",
                  matRefined: "false",
                  matName: mat_name[0],
                  matCount: count,
                  totalMatCount: (parseFloat(total_matCount) + parseFloat(count)).toString()
                });
                break;
              case ("equip"):
                search_data.push({
                  name: body.rows[0].name,
                  status: "Item Equipped",
                  asset_id: body.rows[0].asset_id,
                  matFound: "false",
                  matRefined: "false",
                  equipped: "1",
                  totalMatCount: total_matCount,
                  items_ids: body.rows[0].items
                });
                break;
              case ("unequip"):
                search_data.push({
                  name: body.rows[0].name,
                  status: "De-Equiped",
                  asset_id: body.rows[0].asset_id,
                  matFound: "false",
                  matRefined: "false",
                  equipped: "0",
                  totalMatCount: total_matCount,
                  items_ids: body.rows[0].items
                });
                break;
              default:
                break;
            }
          } else if (body.rows[0].type == "Refiner and crafter") {
            switch (action_type) {
              case ("refining"):
                let inv = [];
                inv = body.rows[0].status.split("%");
                let matName;
                for (const cdata of configData[0].rawmat_refined) {
                  if (inv[1] == cdata.value) {
                    matName = cdata.key;
                    break;
                  }
                }
                search_data.push({
                  name: body.rows[0].name,
                  status: "refine",
                  matFound: "false",
                  matRefined: "true",
                  matName: matName,
                  totalMatCount: (parseFloat(total_matCount) - 2).toString()
                });
                break;
              case ("crafting"):
                let c_inv = [];
                c_inv = body.rows[0].status.split("%");
                let craftName;
                for (const cdata of configData[1]) {
                  if (c_inv[1] == cdata.template_id) {
                    let prefix;
                    if (cdata.item_name == "Mining Cart" || cdata.item_name == "Wagon" || cdata.item_name == "Wheelbarrow") {
                      switch (cdata.rarity) {
                        case ("Common"):
                          prefix = "Birch";
                          break;
                        case ("Uncommon"):
                          prefix = "Oak";
                          break;
                        case ("Rare"):
                          prefix = "Teak";
                          break;
                      }
                    } else {
                      switch (cdata.rarity) {
                        case ("Common"):
                          prefix = "Copper";
                          break;
                        case ("Uncommon"):
                          prefix = "Tin";
                          break;
                        case ("Rare"):
                          prefix = "Iron";
                          break;
                      }
                    }
                    craftName = prefix + " " + cdata.item_name;
                    break;
                  }
                }
                search_data.push({
                  name: body.rows[0].name,
                  status: "craft",
                  matFound: "false",
                  matRefined: "false",
                  matCrafted: "true",
                  matName: craftName,
                  totalMatCount: (parseFloat(total_matCount) - 2).toString()
                });
                break;
              default:
                break;
            }
          }
        }
        unityInstance.SendMessage(
          "GameController",
          "Client_SetCallBackData",
          search_data === undefined ? JSON.stringify({}) : JSON.stringify(search_data)
        );
      }
    }
  } catch (e) {
    unityInstance.SendMessage("ErrorHandler", "Client_SetErrorData", e.message);
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
    unityInstance.SendMessage("ErrorHandler", "Client_SetErrorData", e.message);
  }
}

async function search_citizen(assetId, type, asset_type) {
  try {
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
    if (ninja_arr.includes(asset_type)) {
      await getNinjaD();
      function_call_count = 0;
      await getSearchD("ninjas", assetId, "");
    } else if (professions_arr.includes(asset_type)) {
      await getProfessionD();
      function_call_count = 0;
      await getSearchD("professions", assetId, "start_mat_find");
    }
  } catch (e) {
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
    } else if (professions_arr.includes(race)) {
      await delay(2000);
      await getProfessionD();
    }
    let unregister_callBack = [];
    unregister_callBack.push({
      name: race,
      status: "De-Registered Successfully"
    });

    unityInstance.SendMessage(
      "GameController",
      "Client_SetCallBackData",
      unregister_callBack === undefined ? JSON.stringify({}) : JSON.stringify(unregister_callBack)
    );
  } catch (e) {
    unityInstance.SendMessage("ErrorHandler", "Client_SetErrorData", e.message);
  }
}
// functions for control
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
// Request from Unity
// logout
async function doLogoutAction() {
 localStorage.clear();
}
async function registernft(assetid, race) {
  try {
    const result = await wallet_transact([
      {
        account: contract,
        name: "registernfts",
        authorization: [{
          actor: wallet_userAccount,
          permission: anchorAuth}],
        data: {
          asset_ids: [assetid],
          owner: wallet_userAccount},
      }, 
    ]);
    if (ninja_arr.includes(race)) {
      await delay(2000);
      await getNinjaD();
    } else if (professions_arr.includes(race)) {
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
      "ResponseCallbackData",
      register_callBack === undefined ? JSON.stringify({}) : JSON.stringify(register_callBack)
    );
  } catch (e) {
    unityInstance.SendMessage("ErrorHandler", "Client_SetErrorData", e.message);
  }
}
// Resposne to Unity
async function getNinjaD() {
  try {
    let ninjadata = await getNinjaData();
    console.log(`ninjadata`)

    console.log(ninjadata)
    unityInstance.SendMessage(
      "GameController",
      "Client_SetNinjaData",
      ninjadata === undefined ? JSON.stringify({}) : JSON.stringify(ninjadata)
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
    const user_d = await getUserData();
    let obj = ({
      transactionid: arr,
      citizens: user_d.citizen_count,
      citizens_pack_count : citizens_pack.length
    });

    unityInstance.SendMessage(
      "GameController",
      "Client_TrxHash",
      obj === undefined ? JSON.stringify({}) : JSON.stringify(obj)
    );
  } catch (e) {
    unityInstance.SendMessage("ErrorHandler", "Client_SetErrorData", e.message);
  }
}

const mintmat = async (mat_name) => {
  try {
    const result = await wallet_transact([{
      account: contract,
      name: "mintmats",
      authorization: [{
        actor: wallet_userAccount,
        permission: anchorAuth
      }],
      data: {
        account: wallet_userAccount,
        mat: mat_name,
        amount: 1
      },
    }, ]);
    await result;
    let arr;
    result.transaction_id ? arr = "Mint " + mat_name : "";
    const user_d = await getUserData();
    inventory = await getUserInventoryData(user_d.mat_inventory);
    unityInstance.SendMessage(
      "GameController",
      "Client_SetInventoryData",
      inventory === undefined ? JSON.stringify({}) : JSON.stringify(inventory)
    );
    let obj = ({
      transactionid: arr,
      citizens: total_matCount
    });
    unityInstance.SendMessage(
      "GameController",
      "Client_TrxHash",
      obj === undefined ? JSON.stringify({}) : JSON.stringify(obj)
    );
  } catch (e) {
    unityInstance.SendMessage("ErrorHandler", "Client_SetErrorData", e.message);
  }
}

const burncitizennft = async () => {
  try {
    let id = 0;
    if (citizens_pack.length > 0) {
      id = citizens_pack[0];
      const result = await wallet_transact([{
        account: "atomicassets",
        name: "burnasset",
        authorization: [{
          actor: wallet_userAccount,
          permission: anchorAuth
        }],
        data: {
          asset_owner: wallet_userAccount,
          asset_id: id
        },
      }, ]);
      await result;
      let arr;
      result.transaction_id ? arr = "Burn" : "";
      const user_d = await getUserData();
      citizens_pack.splice(0, 1);
      let obj = ({
        transactionid: arr,
        citizens: user_d.citizen_count,
        citizens_pack_count : citizens_pack.length
      });

      unityInstance.SendMessage(
        "GameController",
        "Client_TrxHash",
        obj === undefined ? JSON.stringify({}) : JSON.stringify(obj)
      );
    }
  } catch (e) {
    unityInstance.SendMessage("ErrorHandler", "Client_SetErrorData", e.message);
  }
}

const burn_itemsnft = async (item_name,asset_id) => {
  try {
      const user_d = await getUserData();
      const temp_inventory = await getUserInventoryData(user_d.mat_inventory);
      const result = await wallet_transact([{
        account: "atomicassets",
        name: "burnasset",
        authorization: [{
          actor: wallet_userAccount,
          permission: anchorAuth
        }],
        data: {
          asset_owner: wallet_userAccount,
          asset_id: asset_id,
          memo : "burnrng"
        },
      }, ]);
      await result;
      if(typeof(result.transaction_id) != 'undefined'){
        let callBack = [];
        await delay(1500);
        const new_user_d = await getUserData();
        const after_burn_inventory = await getUserInventoryData(new_user_d.mat_inventory);
        for(const temp_data of temp_inventory){
          for(const new_data of after_burn_inventory){
            if(temp_data.name == new_data.name){
              if(temp_data.count == new_data.count)
                break;
              else if (temp_data.count != new_data.count){
                callBack.push({
                  name: new_data.name,
                  count: (parseFloat(temp_data.count) - parseFloat(new_data.count)).toString()
                });
                break;
              }
            }
          }
        }
        await getItemD();
        unityInstance.SendMessage(
          "GameController",
          "Client_SetInventoryData",
          after_burn_inventory === undefined ? JSON.stringify({}) : JSON.stringify(after_burn_inventory)
        );
        let obj = ({
          transactionid: item_name,
          citizens: ""
        });
        unityInstance.SendMessage(
          "GameController",
          "Client_TrxHash",
          obj === undefined ? JSON.stringify({}) : JSON.stringify(obj)
        );
        if(callBack.length == 0){
          callBack.push({name:"null"});
          unityInstance.SendMessage(
            "GameController",
            "Client_SetBurnInventoryData",
            callBack === undefined ? JSON.stringify({}) : JSON.stringify(callBack)
            );
        }
        else {
          unityInstance.SendMessage(
          "GameController",
          "Client_SetBurnInventoryData",
          callBack === undefined ? JSON.stringify({}) : JSON.stringify(callBack)
          );
        }
      }
  } catch (e) {
    unityInstance.SendMessage("ErrorHandler", "Client_SetErrorData", e.message);
  }
}

const burn_profession_nft = async(profession_name,asset_id) => {
  try {
      const temp_citizens = (await getUserData()).citizen_count;
      const result = await wallet_transact([{
        account: "atomicassets",
        name: "burnasset",
        authorization: [{
          actor: wallet_userAccount,
          permission: anchorAuth
        }],
        data: {
          asset_owner: wallet_userAccount,
          asset_id: asset_id,
          memo : "burnrng"
        },
      }, ]);
      await result;
      if(typeof(result.transaction_id) != 'undefined'){
        const new_citizens = (await getUserData()).citizen_count;
        let diff = new_citizens - temp_citizens;
        await getProfessionD();
        let callBack = [];
        callBack.push({
          name: profession_name,
          status: "Burnt Successfully"
        });
        unityInstance.SendMessage(
          "GameController",
          "Client_SetCallBackData",
          callBack === undefined ? JSON.stringify({}) : JSON.stringify(callBack)
        );
        let obj = ({
          transactionid: profession_name + "%" + diff,
          citizens: new_citizens
        });
        unityInstance.SendMessage(
          "GameController",
          "Client_TrxHash",
          obj === undefined ? JSON.stringify({}) : JSON.stringify(obj)
        );
      }
  }
  catch(e){

  }
}

const GetAsset_TemplateData = async (id) => {
  var path = "atomicassets/v1/assets?collection_name=" + collectionName + "&schema_name=materials&template_id=" + id + "&owner=" + userAccount + "&page=1&limit=1&order=desc&sort=asset_id";
  const response = await fetch("https://" + "test.wax.api.atomicassets.io/" + path, {
    headers: {
      "Content-Type": "text/plain"
    },
    method: "POST",
  });

  const body = await response.json();
  if (body.data.length == 0)
    return 0;
  else
    return body.data[0].asset_id
}

const burnmat = async (mat_name) => {
  try {
    let template_id;
    assetData = Object.values(await getAssets("materials"));
    for (const c_data of configData[0].template_ids) {
      if (c_data.key == mat_name) {
        template_id = c_data.value;
        break;
      }
    }
    asset_id = await GetAsset_TemplateData(template_id);
    if (asset_id != 0) {
      const result = await wallet_transact([{
        account: "atomicassets",
        name: "burnasset",
        authorization: [{
          actor: wallet_userAccount,
          permission: anchorAuth
        }],
        data: {
          asset_owner: wallet_userAccount,
          asset_id: asset_id
        },
      }, ]);
      await result;
      let arr;
      result.transaction_id ? arr = "Burn " + mat_name : "";
      const user_d = await getUserData();
      inventory = await getUserInventoryData(user_d.mat_inventory);
      unityInstance.SendMessage(
        "GameController",
        "Client_SetInventoryData",
        inventory === undefined ? JSON.stringify({}) : JSON.stringify(inventory)
      );
      let obj = ({
        transactionid: arr,
        citizens: total_matCount
      });
      unityInstance.SendMessage(
        "GameController",
        "Client_TrxHash",
        obj === undefined ? JSON.stringify({}) : JSON.stringify(obj)
      );
    } else {
      let obj = ({
        transactionid: "None " + "mat",
      });
      unityInstance.SendMessage(
        "GameController",
        "Client_TrxHash",
        obj === undefined ? JSON.stringify({}) : JSON.stringify(obj)
      );
    }
  } catch (e) {
    unityInstance.SendMessage("ErrorHandler", "Client_SetErrorData", e.message);
  }
}
const SendUserMaxNftCount = async () => {
   try {
      // Max count of nft
      userData = await getUserData();
      max_count = await getNftCount(userData.nft_counts);
      unityInstance.SendMessage(
        "GameController",
        "GetUserMaxNftCount",
        max_count === undefined ? JSON.stringify({}) : JSON.stringify(max_count)
      );
    } catch (e) {
    unityInstance.SendMessage("ErrorHandler", "SendUserMaxNftCount", e.message);
  }

}
const example = async (asset_id, memo, type) => {
   try {
    } catch (e) {
    unityInstance.SendMessage("ErrorHandler", "Client_SetErrorData", e.message);
  }

}
const transfer = async (asset_id, memo, type) => {
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
    if (memo == "regupgrade") {
      await SendUserMaxNftCount();
      settlements_data = await getSettlementData();
      unityInstance.SendMessage(
        "GameController",
        "Client_SetSettlementData",
        settlements_data === undefined ? JSON.stringify({}) : JSON.stringify(settlements_data)
      );
      let callBack = [];
      callBack.push({
        name: type,
        status: "Registered Successfully"
      });
      unityInstance.SendMessage(
        "GameController",
        "ResponseCallbackData",
        callBack === undefined ? JSON.stringify({}) : JSON.stringify(callBack)
      );

    }
  } catch (e) {
    unityInstance.SendMessage("ErrorHandler", "Client_SetErrorData", e.message);
  }
}

const equipItems = async (p_id, asset_id) => {
  try {
    const result = await wallet_transact([{
      account: contract,
      name: "equipitems",
      authorization: [{
        actor: wallet_userAccount,
        permission: anchorAuth
      }],
      data: {
        item_ids: [asset_id],
        profession_id: p_id
      },
    }, ]);
    await delay(3000);
    await getProfessionD();
    function_call_count = 0;
    await getItemD();
    await getSearchD("professions", p_id, "equip");
  } catch (e) {
    unityInstance.SendMessage("ErrorHandler", "Client_SetErrorData", e.message);
  }
}

const unequipItems = async (asset_id,mat_name,p_id) => {
  try {
    const result = await wallet_transact([{
      account: contract,
      name: "unequipitems",
      authorization: [{
        actor: wallet_userAccount,
        permission: anchorAuth
      }],
      data: {
        item_ids: [asset_id]
      },
    }, ]);
    await getProfessionD();
    function_call_count = 0;
    await getItemD();
    await getSearchD("professions", p_id, "unequip");
    let obj = ({
      transactionid: mat_name,
      citizens: ""
    });
    unityInstance.SendMessage(
      "GameController",
      "Client_TrxHash",
      obj === undefined ? JSON.stringify({}) : JSON.stringify(obj)
    );
  } catch (e) {
    unityInstance.SendMessage("ErrorHandler", "Client_SetErrorData", e.message);
  }
}

const withdraw_asset = async (asset_id, type) => {
  try {
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
    await SendUserMaxNftCount();
    settlements_data = await getSettlementData();
    unityInstance.SendMessage(
      "GameController",
      "Client_SetSettlementData",
      settlements_data === undefined ? JSON.stringify({}) : JSON.stringify(settlements_data)
    );
    let callBack = [];
    callBack.push({
      name: type,
      status: "De-Registered Successfully"
    });
    unityInstance.SendMessage(
      "GameController",
      "ResponseCallbackData",
      callBack === undefined ? JSON.stringify({}) : JSON.stringify(callBack)
    );
  } catch (e) {
    unityInstance.SendMessage("ErrorHandler", "Client_SetErrorData", e.message);
  }
}

const find_mat = async (asset_id) => {
  try {
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
    await getProfessionD();
    const user_d = await getUserData();
    inventory = await getUserInventoryData(user_d.mat_inventory);
    unityInstance.SendMessage(
      "GameController",
      "Client_SetInventoryData",
      inventory === undefined ? JSON.stringify({}) : JSON.stringify(inventory)
    );
    function_call_count = 0;
    await getSearchD("professions", asset_id, "find_mat")
  } catch (e) {
    unityInstance.SendMessage("ErrorHandler", "Client_SetErrorData", e.message);
  }
}

const mat_refine = async (p_asset_id, mat_name, refine_profession_name) => {
  try {
    const result = await wallet_transact([{
      account: contract,
      name: "startcraft",
      authorization: [{
        actor: wallet_userAccount,
        permission: anchorAuth
      }],
      data: {
        assetID: p_asset_id,
        account: wallet_userAccount,
        mat: mat_name,
        refining: true
      },
    }, ]);
    await delay(2000);
    await getProfessionD();
    const user_d = await getUserData();
    inventory = await getUserInventoryData(user_d.mat_inventory);
    unityInstance.SendMessage(
      "GameController",
      "Client_SetInventoryData",
      inventory === undefined ? JSON.stringify({}) : JSON.stringify(inventory)
    );
    let callBack = [];
    callBack.push({
      name: refine_profession_name,
      status: "Refining Started"
    });
    unityInstance.SendMessage(
      "GameController",
      "Client_SetCallBackData",
      callBack === undefined ? JSON.stringify({}) : JSON.stringify(callBack)
    );
  } catch (e) {
    unityInstance.SendMessage("ErrorHandler", "Client_SetErrorData", e.message);
  }
}

const mat_craft = async (p_asset_id, mat_template, profession_name) => {
  try {
    const result = await wallet_transact([{
      account: contract,
      name: "startcraft",
      authorization: [{
        actor: wallet_userAccount,
        permission: anchorAuth
      }],
      data: {
        assetID: p_asset_id,
        account: wallet_userAccount,
        mat: mat_template,
        refining: false
      },
    }, ]);
    await delay(2000);
    await getProfessionD();
    const user_d = await getUserData();
    inventory = await getUserInventoryData(user_d.mat_inventory);
    unityInstance.SendMessage(
      "GameController",
      "Client_SetInventoryData",
      inventory === undefined ? JSON.stringify({}) : JSON.stringify(inventory)
    );
    let callBack = [];
    callBack.push({
      name: profession_name,
      status: "Crafting Started"
    });
    unityInstance.SendMessage(
      "GameController",
      "Client_SetCallBackData",
      callBack === undefined ? JSON.stringify({}) : JSON.stringify(callBack)
    );
  } catch (e) {
    unityInstance.SendMessage("ErrorHandler", "Client_SetErrorData", e.message);
  }
}

const mat_refine_comp = async (p_asset_id) => {
  try {
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
      },
    }, ]);
    await delay(3600);
    await getProfessionD();
    function_call_count = 0;
    const user_d = await getUserData();
    inventory = await getUserInventoryData(user_d.mat_inventory);
    unityInstance.SendMessage(
      "GameController",
      "Client_SetInventoryData",
      inventory === undefined ? JSON.stringify({}) : JSON.stringify(inventory)
    );
    await getSearchD("professions", p_asset_id, "refining");
  } catch (e) {
    unityInstance.SendMessage("ErrorHandler", "Client_SetErrorData", e.message);
  }
}

const mat_craft_comp = async (p_asset_id) => {
  try {
    const result = await wallet_transact([{
      account: contract,
      name: "craftitem",
      authorization: [{
        actor: wallet_userAccount,
        permission: anchorAuth
      }],
      data: {
        professID: p_asset_id,
        account: wallet_userAccount,
      },
    }, ]);
    await delay(3600);
    await getProfessionD();
    function_call_count = 0;
    const user_d = await getUserData();
    inventory = await getUserInventoryData(user_d.mat_inventory);
    unityInstance.SendMessage(
      "GameController",
      "Client_SetInventoryData",
      inventory === undefined ? JSON.stringify({}) : JSON.stringify(inventory)
    );
    await getSearchD("professions", p_asset_id, "crafting");
  } catch (e) {
    unityInstance.SendMessage("ErrorHandler", "Client_SetErrorData", e.message);
  }
}


