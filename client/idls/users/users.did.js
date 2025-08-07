export const idlFactory = ({ IDL }) => {
  const AddUserArgs = IDL.Record({ 'username' : IDL.Text });
  const Result = IDL.Variant({ 'Ok' : IDL.Null, 'Err' : IDL.Text });
  const User = IDL.Record({
    'principal' : IDL.Principal,
    'username' : IDL.Text,
    'created_at' : IDL.Nat64,
  });
  const Result_1 = IDL.Variant({ 'Ok' : User, 'Err' : IDL.Text });
  return IDL.Service({
    'add_user' : IDL.Func([AddUserArgs], [Result], []),
    'get_user' : IDL.Func([], [Result_1], ['query']),
    'get_users' : IDL.Func([], [IDL.Vec(User)], ['query']),
  });
};
export const init = ({ IDL }) => { return []; };
