export const idlFactory = ({ IDL }) => {
  const Chain = IDL.Variant({
    'ICP' : IDL.Null,
    'Ethereum' : IDL.Null,
    'Solana' : IDL.Null,
    'Bitcoin' : IDL.Null,
    'Other' : IDL.Text,
  });
  const ChainData = IDL.Record({
    'chain' : Chain,
    'wallet_address' : IDL.Text,
    'wallet' : IDL.Text,
  });
  const AddUserArgs = IDL.Record({
    'username' : IDL.Text,
    'interests' : IDL.Vec(IDL.Text),
    'email' : IDL.Opt(IDL.Text),
    'referral_code' : IDL.Opt(IDL.Text),
    'referral_source' : IDL.Opt(IDL.Text),
    'chain_data' : ChainData,
  });
  const Result = IDL.Variant({ 'Ok' : IDL.Null, 'Err' : IDL.Text });
  const Interest = IDL.Record({ 'value' : IDL.Text });
  const User = IDL.Record({
    'principal' : IDL.Principal,
    'username' : IDL.Text,
    'interests' : IDL.Vec(Interest),
    'created_at' : IDL.Nat64,
    'email' : IDL.Opt(IDL.Text),
    'referral_code' : IDL.Opt(IDL.Text),
    'referral_source' : IDL.Opt(IDL.Text),
    'chain_data' : ChainData,
  });
  const Result_1 = IDL.Variant({ 'Ok' : User, 'Err' : IDL.Text });
  return IDL.Service({
    'add_user' : IDL.Func([AddUserArgs], [Result], []),
    'get_user' : IDL.Func([], [Result_1], ['query']),
    'get_users' : IDL.Func([], [IDL.Vec(User)], ['query']),
    'is_username_available' : IDL.Func([IDL.Text], [IDL.Bool], ['query']),
  });
};
export const init = ({ IDL }) => { return []; };
