
import { getActor } from "./utils";
import dotenv from 'dotenv';

dotenv.config();

export const getStatus = async (network: string) => {

  const actor = await getActor(network);

  const status = await actor.initiateAuth("test_user", []);

  console.log(`Status: ${status}`);

  return status;
};
