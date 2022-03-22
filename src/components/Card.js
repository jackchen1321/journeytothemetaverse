import { useEffect } from 'react';
import { toast } from 'react-toastify';
import { useEthers } from '@usedapp/core';
import { useHardStake, useUnHardStake } from '../hooks/StakingContract';
import { useApprove } from '../hooks/GameFiContract';
import { StakingContractAddress } from '../contracts';

const Card = (props) => {
  const { account } = useEthers();
  const { state: hardState, send: hardStake } = useHardStake();
  const { state: unHardState, send: unHardStake } = useUnHardStake();
  const { state: approveState, send: approveSend } = useApprove();

  const { loadingFlag, setLoadingFlag } = props;

  const hardStaking = async (tokenId) => {
    try {
      setLoadingFlag(true);
      account && (await approveSend(StakingContractAddress, tokenId));
      console.log('approveSend');
      setLoadingFlag(true);
      account && (await hardStake(tokenId));
      console.log('hardStake');
      toast.success('successful', {
        position: toast.POSITION.TOP_RIGHT,
        autoClose: 5000,
      });
      setLoadingFlag(false);
    } catch {
      toast.error('error', {
        position: toast.POSITION.TOP_RIGHT,
        autoClose: 5000,
      });
      setLoadingFlag(false);
    }
  };
  const unHardStaking = async (tokenId) => {
    try {
      setLoadingFlag(true);
      account && (await unHardStake(tokenId));
      toast.success('successful', {
        position: toast.POSITION.TOP_RIGHT,
        autoClose: 5000,
      });
      setLoadingFlag(false);
    } catch (e) {
      toast.error('error', {
        position: toast.POSITION.TOP_RIGHT,
        autoClose: 5000,
      });
      setLoadingFlag(false);
    }
  };

  useEffect(() => {
    console.log('rerendered', loadingFlag);

    if (account) {
      approveState.status === 'Exception' &&
        toast.error('approve_error', {
          position: toast.POSITION.TOP_RIGHT,
          autoClose: 5000,
        });
      approveState.status === 'Success' &&
        toast.success('success', {
          position: toast.POSITION.TOP_RIGHT,
          autoClose: 5000,
        });
      hardState.status === 'Exception' &&
        toast.error('Lock_error', {
          position: toast.POSITION.TOP_RIGHT,
          autoClose: 5000,
        });
      hardState.status === 'Success' &&
        toast.success('success', {
          position: toast.POSITION.TOP_RIGHT,
          autoClose: 5000,
        });
      unHardState.status === 'Exception' &&
        toast.error('unLock_error', {
          position: toast.POSITION.TOP_RIGHT,
          autoClose: 5000,
        });
      unHardState.status === 'Success' &&
        toast.success('success', {
          position: toast.POSITION.TOP_RIGHT,
          autoClose: 5000,
        });
    }
  }, [account]);

  return (
    <div
      className='lg:w-1/4 md:w-1/2 p-3 w-full bg-stakingBorder mb-10'
      style={{ backgroundSize: '100% 100%' }}
    >
      <div className='rounded-md shadow-lg shadow-emerald-700/50'>
        <a
          className='block relative h-48 rounded overflow-hidden bg-[#1c1b1b] pb-8'
          href='/#'
        >
          <img
            alt='ecommerce'
            className='object-cover object-center w-full h-full block'
            src={props.item.link}
          />
        </a>
        <div className='p-3'>
          <h2 className='text-gray-500 tracking-widest title-font mb-1'>
            Journey to the metaverse
          </h2>

          <h3 className='text-white title-font text-lg font-medium'>
            {props.item.type}
          </h3>
          <div className='flex justify-between mt-6 text-white'>
            <p className=' '>{props.item.edition}</p>
            <div className='flex items-center gap-2 cursor-pointer'>
              <input
                type='checkbox'
                id={`multistake-${props.item.edition}`}
                className='cursor-pointer w-4 h-4'
                checked={props.selectedIds.includes(props.item.edition)}
                onChange={() => props.handleSelected(props.item.edition)}
              />
              <label
                htmlFor={`multistake-${props.item.edition}`}
                className='cursor-pointer'
              >
                {props.item.type === 'Locked NFT'
                  ? 'Multiunstake'
                  : 'Multistake'}
              </label>
            </div>
          </div>
          <div className='flex items-center justify-between gap-x-3 my-6'>
            <button
              className='w-full bg-unstakingButton md:w-1/2  rounded text-[#0dba88]  text-base bg-[#1c1b1b] p-2 hover:bg-gray-700  hover:text-white bg-gray--500 active:bg-gray-700 focus:outline-none focus:ring focus:ring-cyan-300 shadow-lg shadow-cyan-700/50'
              onClick={(e) => unHardStaking(props.item.edition)}
              disabled={props.item.type === 'UnLocked NFT' ? 'disabled' : ''}
            >
              UnStake
            </button>
            <button
              className='w-full bg-stakingButton md:w-1/2 rounded bg-[#0dba88] text-white   text-base p-2 hover:bg-[#0dba88]-500  hover:text-[#0dba88]-300 bg-gray--500 active:bg-gray-700 focus:outline-none focus:ring focus:ring-cyan-300 shadow-lg shadow-stone-700/50'
              onClick={(e) => hardStaking(props.item.edition)}
              disabled={props.item.type === 'Locked NFT' ? 'disabled' : ''}
            >
              Stake
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Card;
