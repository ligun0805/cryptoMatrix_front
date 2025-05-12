import axios from "axios";
import Web3 from "web3";

// TODO: try to get api key from .env
const getRpcUrl = (key) => {
  // Используем публичные узлы BSC вместо Infura
  return "https://data-seed-prebsc-1-s1.binance.org:8545/";
};

const createBody = (address, topics) => ({
  jsonrpc: "2.0",
  method: "eth_getLogs",
  params: [
    {
      address,
      fromBlock: "earliest",
      topics,
    },
  ],
  id: "1",
});

// decoding example: keccak-256(`ClaimsSpent(address,uint256,uint256)`)
export const EventMap = {
  WhoseRegistered:
    "0x6ab541b1c1f8ccbaff8d2e99776a9031b131e4282e138c33dc645fcff8b2c813",
  ReferralEarn:
    "0x43031c57404141a57f71e1d0b685cd228ca9283f176e2c2fd60037ed7b1adf18",
  GiftAppear:
    "0xf21adea5d57308a9db93e1096251a15ccaaf229f57256fe0249cb1a99a272e11",
  GiftSpent:
    "0xf18fbda08e8278ab48846622fc8383c17a3883e113fee336afcf563624a7a01c",
  ClaimsAppear:
    "0x88c484291ad002b95046f48056cff465fa231fe6e8a77174f0a72eb357ff6d98",
  ClaimsSpent:
    "0x7e400c520d3c15affc1a9456dc5c2cc9120b1dbf41de20aa72f72c7a28afbdb7",
  BelowTwoAppear:
    "0xdf09d32c9fb6ed1cd2c0baf4779a62ca391bb67477ae59dde70805f1819303ed",
  ClaimsWithdraw:
    "0x45d7c638dacbe920c33c14609961ca0ff27e1ff551e1203e285b5bb236dffc7c",
  DirectTransfer:
    "0x455589ce42ffef071437b1cd8549f4989ab4ada16aa8132e13a4fdf75df577cf",
};

// todo -- https://community.infura.io/t/is-there-way-to-filter-logs-events-by-an-event-arguments/8405

const prepareTopicFilters = (filters) =>
  filters && filters.length > 0
    ? filters.map((filter) => (filter ? makeAddressWord(filter) : null))
    : filters;

export const GetEvents = async (eventName, filterArray) => {
  const config = useRuntimeConfig();
  console.log(`GetEvents: Starting request for ${eventName}`);
  console.log(
    `GetEvents: CONTRACT_ADDRESS = ${config.public.CONTRACT_ADDRESS}`
  );

  const url = getRpcUrl(config.public.INFURA_KEY);
  console.log(`GetEvents: Using RPC URL: ${url}`);

  const topics =
    filterArray && filterArray.length > 0
      ? [EventMap[eventName], ...prepareTopicFilters(filterArray)]
      : [EventMap[eventName]];
  console.log(`GetEvents: Topics for ${eventName}:`, topics);

  const body = createBody(config.public.CONTRACT_ADDRESS, topics);
  console.log(`GetEvents: Request body:`, body);

  try {
    console.log(`GetEvents: Sending request to RPC...`);
    const response = await axios.post(url, body);
    console.log(
      `GetEvents: Received response for ${eventName}:`,
      response.data
    );

    if (!response.data.result || response.data.result.length === 0) {
      console.log(`GetEvents: No events found for ${eventName}`);
      return [];
    }

    // pass first topic to parseResult
    console.log(`GetEvents: Parsing ${response.data.result.length} events...`);
    return await parseResult(eventName, response.data.result);
  } catch (e) {
    console.error(`GetEvents: Error fetching ${eventName} events:`, e);
    return [];
  }
};

const parseResult = async (eventName, events) => {
  try {
    console.log(`parseResult: Loading ABI for ${eventName}...`);
    // get event abi from according json file
    const eventAbi = await import(`./events-abi/${eventName}.json`);
    console.log(`parseResult: Loaded ABI:`, eventAbi);

    const web3 = new Web3();
    const decodedDataArray = [];

    for (const event of events) {
      try {
        console.log(`parseResult: Decoding event:`, event);
        const data = web3.eth.abi.decodeLog(
          eventAbi.inputs,
          event.data,
          event.topics.slice(1)
        );
        console.log(`parseResult: Decoded data:`, data);
        decodedDataArray.push(data);
      } catch (decodeError) {
        console.error(`parseResult: Error decoding event:`, decodeError);
      }
    }
    return decodedDataArray;
  } catch (e) {
    console.error(`parseResult: Error loading ABI or processing events:`, e);
    return [];
  }
};

const makeAddressWord = (address) => {
  if (address.slice(0, 2) === "0x") address = address.slice(2);
  else {
    throw new Error("address must begins with 0x");
  }
  return `0x000000000000000000000000${address}`.toLowerCase();
};
