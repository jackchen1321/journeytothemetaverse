import { ethers } from 'ethers';
import { Contract } from '@ethersproject/contracts';
import { useCall, useContractFunction } from '@usedapp/core';
import StakingContractABI from '../abi/StakingContractABI.json';
import { StakingContractAddress } from '../contracts';

const StakingContractInterface = new ethers.utils.Interface(StakingContractABI);

const StakingContract = new Contract(
  StakingContractAddress,
  StakingContractInterface
);

export const useHardStake = () => {
  const { state, send, event } = useContractFunction(
    StakingContract,
    'hardStake',
    {}
  );
  return { state, send, event };
};

export const useUnHardStake = () => {
  const { state, send, event } = useContractFunction(
    StakingContract,
    'unHardStake',
    {}
  );
  return { state, send, event };
};

export const useGetHardStakingTokens = (account) => {
  const { value, error } = useCall(account && {
    contract: new Contract(StakingContractAddress, StakingContractInterface),
    method: 'getHardStakingTokens',
    args: [account]
  }) ?? {}
  if(error) {
    return undefined
  }
  return value;
};

export const useGetTotalHardStakers = () => {
  const { value, error } = useCall({
    contract: new Contract(StakingContractAddress, StakingContractInterface),
    method: 'totalHardStaker',
    args: []
  }) ?? {}
  if(error) {
    return undefined
  }
  return value;
};
export const useGetTotalStakedNFTs = () => {
  const { value, error } = useCall({
    contract: new Contract(StakingContractAddress, StakingContractInterface),
    method: 'totalStakedNFT',
    args: []
  }) ?? {}
  if(error) {
    return undefined
  }
  return value;
};