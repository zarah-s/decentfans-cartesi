// XXX even though ethers is not used in the code below, it's very likely
// it will be used by any DApp, so we are already including it here
const { ethers } = require("ethers");
const methods = require("./methods");
const { checkContentValidity } = require("./mods/content/checks");
const { stringToHex } = require("./helpers/helpers");
const { checkContentExistence, insufficientBalance, staked } = require("./mods/stake/checks");

const rollup_server = process.env.ROLLUP_HTTP_SERVER_URL;
console.log("HTTP rollup_server url is " + rollup_server);

let contents = [];
let subscriptions = {}
let balanceOf = {};



const emitReport = async (e) => {
  await fetch(rollup_server + "/report", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      payload: stringToHex(JSON.stringify({ error: e })),
    }),
  });
  return "reject";
}


const emitNotice = async (data) => {
  const hexresult = stringToHex(data);
  const advance_req = await fetch(rollup_server + "/notice", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ payload: hexresult }),
  });
  return advance_req;
}

async function handle_advance(data) {
  const payload = data.payload;
  let JSONpayload = {};
  const payloadStr = ethers.toUtf8String(payload);
  JSONpayload = JSON.parse(payloadStr);

  console.log("PAYLOAD========>>", payloadStr)
  console.log("------------------------------------------")

  switch (JSONpayload.method) {
    case methods.CREATE_CONTENT:
      console.log("CREATE CONTENT")
      console.log("------------------------------------------")

      const contentValidity = checkContentValidity(JSONpayload)
      if (!contentValidity) {
        const processed = { ...JSONpayload, method: undefined, author: data.metadata.msg_sender, id: contents.length, subscribers: [] };
        contents.push(processed)
        await emitNotice({ state: "contents", data: contents })
      } else {
        await emitReport(contentValidity)
      }
      break;

    case methods.STAKE:
      const sender = data.metadata.msg_sender;
      const isContentValid = checkContentExistence(JSONpayload.id, contents);
      if (isContentValid.success) {
        const checkInsufficientBalance = insufficientBalance(sender, isContentValid, balanceOf);
        if (!insufficientBalance) {
          const hasStaked = staked(sender, isContentValid);
          if (hasStaked) {
            await emitReport(checkInsufficientBalance)
          } else {
            balanceOf[sender] = balanceOf[sender] - contents[isContentValid.index].amount;
            subscriptions[sender] = [
              ...subscriptions[sender] ?? [],
              isContentValid.data.id
            ].flat()

            contents[isContentValid.index].subscribers.push(sender);
            await emitNotice({ state: "contents", data: contents })
            await emitNotice({ state: "subscriptions", data: subscriptions })
            await emitNotice({ state: "balances", data: balanceOf })

          }
        } else {
          await emitReport(checkInsufficientBalance)
        }
      } else {
        await emitReport(isContentValid)
      }


      console.log(contents)
      console.log("------------------------------------------")

      break;

    default:
      break;
  }







  console.log("Received advance request data " + JSON.stringify(data));
  return "accept";
}

async function handle_inspect(data) {
  console.log("Received inspect request data " + JSON.stringify(data));
  return "accept";
}

var handlers = {
  advance_state: handle_advance,
  inspect_state: handle_inspect,
};

var finish = { status: "accept" };

(async () => {
  while (true) {
    const finish_req = await fetch(rollup_server + "/finish", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: "accept" }),
    });

    console.log("Received finish status " + finish_req.status);

    if (finish_req.status == 202) {
      console.log("No pending rollup request, trying again");
    } else {
      const rollup_req = await finish_req.json();
      var handler = handlers[rollup_req["request_type"]];
      finish["status"] = await handler(rollup_req["data"]);
    }
  }
})();
