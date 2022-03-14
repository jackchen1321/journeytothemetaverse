import { ethers } from 'ethers';
import { Contract } from '@ethersproject/contracts';
import { useCall, useContractFunction } from '@usedapp/core';
import TokenContractABI from '../abi/TokenContractABI.json';
import { TokenContractAddress } from '../contracts';

const TokenContractInterface = new ethers.utils.Interface(TokenContractABI);

const TokenContract = new Contract(
  TokenContractAddress,
  TokenContractInterface
);

export const useGetUserBalance = (account) => {
  const { value, error } = useCall(account && {
    contract: new Contract(TokenContractAddress, TokenContractInterface),
    method: 'getUserBalance',
    args: [account]
  }) ?? {}
  if(error) {
    return undefined
  }
  return value;
};

export const useWithdrawAURA = () => {
  const { state, send, event } = useContractFunction(
    TokenContract,
    'withdrawAURA',
    {}
  );
  return { state, send, event };
};

export const useApprove  = () => {
  const { state, send, event } = useContractFunction(
    TokenContract,
    'approve',
    {}
  );
  return { state, send, event };
};