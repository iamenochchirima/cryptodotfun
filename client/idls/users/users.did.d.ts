import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface AddUserArgs { 'username' : string }
export type Result = { 'Ok' : null } |
  { 'Err' : string };
export type Result_1 = { 'Ok' : User } |
  { 'Err' : string };
export interface User {
  'principal' : Principal,
  'username' : string,
  'created_at' : bigint,
}
export interface _SERVICE {
  'add_user' : ActorMethod<[AddUserArgs], Result>,
  'get_user' : ActorMethod<[], Result_1>,
  'get_users' : ActorMethod<[], Array<User>>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
