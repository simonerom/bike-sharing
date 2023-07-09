import { GetDataByRID, Log, SendTx } from "@w3bstream/wasm-sdk";

import { buildTxData } from "../utils/build-tx";
import { getIntegerField, getPayloadValue, getStringField } from "../utils/payload-parser";

const MINT_FUNCTION_ADDR = "40c10f19";
const CHAIN_ID = 4690;
const TOKEN_CONTRACT_ADDRESS = "0xaDDda062F058f943721590B90Fc7219fbB7CDc9d";
const WEIGHT_DISTANCE = 0.001; // Pay 1 token every 1km
const WEIGHT_DURATION = 0.005; // Pay 1 token every 3 minutes

// This global variable counts each line logged to the console
let lineCount: i32 = 0;

/*
* Each time a new ride is completed, the device sends a message 
* to the W3bstream applet that looks like this:
* {
*   "bike_owner": "0xabcd...",
*   "ride_start": "123456789",
*   "ride_duration": 12345,
*   "ride_distance": 12345,
*/

export function handle_data(rid: i32): i32 {
  log("New ride data received!");
  const deviceMessage = GetDataByRID(rid);
  const payload = getPayloadValue(deviceMessage);

  const bike_owner = getStringField(payload, "bike_owner");
  const ride_start = getStringField(payload, "ride_start");
  const ride_duration = getIntegerField(payload, "ride_duration");
  const ride_distance = getIntegerField(payload, "ride_distance");

  if (
    bike_owner === null || 
    ride_start === null || 
    ride_duration === null || 
    ride_distance === null) {
    log("Invalid payload, fields cannot be null");
    return 1;
  }

  log("Bike owner address: " + bike_owner);
  log("Ride start: " + ride_start);
  log("Ride duration: " + ride_duration.toString() + " seconds")
  log("Ride distance: " + ride_distance.toString() + " meters");


  const due: f64 = 
    f64(ride_duration) * WEIGHT_DURATION + 
    f64(ride_distance) * WEIGHT_DISTANCE;
  
  log("Due amount: " + due.toString());
  log("Sending tokens to owner address...");
  log("Token Contarct: " + TOKEN_CONTRACT_ADDRESS);

  mintRewards(bike_owner, due.toString());

  return 0;
}

function mintRewards(ownerAddress: string, amount: string): void {
  log(`Minting ${amount} tokens to ${ownerAddress}`);
  const txData = buildTxData(MINT_FUNCTION_ADDR, ownerAddress, amount);
  const res = SendTx(CHAIN_ID, TOKEN_CONTRACT_ADDRESS, "0", txData);
  log("Send tx result:" + res);
}

export function log(str: string): void {
  // logs the line count and the message
  Log(lineCount.toString() + ". " + str);
  lineCount += 1;
}