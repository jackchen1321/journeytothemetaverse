import { useEffect } from "react";
import { toast } from 'react-toastify'
import { useEthers } from '@usedapp/core'
import { useHardStake, useUnHardStake } from '../hooks/StakingContract'
import { useApprove } from '../hooks/GameFiContract'
import { StakingContractAddress } from '../contracts';

const Card = (props) => {
  const { account } = useEthers()
  const {state: hardState, send: hardStake} = useHardStake();
  const {state: unHardState, send: unHardStake} = useUnHardStake();
  const { state: approveState, send: approveSend } = useApprove()
  
  const {loadingFlag, setLoadingFlag} = props

  const hardStaking = async (tokenId) =>{
    try {
      setLoadingFlag(true);
      account && await approveSend(StakingContractAddress, tokenId)
      console.log("approveSend");
      setLoadingFlag(true);
      account && await hardStake(tokenId)
      console.log("hardStake");
      toast.success('successful',{position: toast.POSITION.TOP_RIGHT, autoClose:5000});
      setLoadingFlag(false);
    } catch {
      toast.error('error',{position: toast.POSITION.TOP_RIGHT, autoClose:5000});
      setLoadingFlag(false);
    }
    
  }
  const  unHardStaking = async(tokenId) =>{
    try{
      setLoadingFlag(true);
      account && await unHardStake(tokenId)
      toast.success('successful',{position: toast.POSITION.TOP_RIGHT, autoClose:5000});
      setLoadingFlag(false);
    } catch(e){
      toast.error('error',{position: toast.POSITION.TOP_RIGHT, autoClose:5000});
      setLoadingFlag(false);
    }
    
  }

  useEffect(() => {
    console.log('rerendered', loadingFlag)

    if (account) {
      approveState.status === 'Exception' && toast.error('approve_error',{position: toast.POSITION.TOP_RIGHT, autoClose:5000});
      approveState.status === 'Success' && toast.success('success',{position: toast.POSITION.TOP_RIGHT, autoClose:5000});
      hardState.status === 'Exception' && toast.error('Lock_error',{position: toast.POSITION.TOP_RIGHT, autoClose:5000});
      hardState.status === 'Success' && toast.success('success',{position: toast.POSITION.TOP_RIGHT, autoClose:5000});
      unHardState.status === 'Exception' && toast.error('unLock_error',{position: toast.POSITION.TOP_RIGHT, autoClose:5000});
      unHardState.status === 'Success' && toast.success('success',{position: toast.POSITION.TOP_RIGHT, autoClose:5000});
    }
  }, [account])
  
  return (
    <div className='lg:w-1/4 md:w-1/2 p-3 w-full  mb-10'>
      <div className=' rounded-md bg-[#1c1b1b] p-3 shadow-lg shadow-emerald-700/50'>
        <a className='block relative h-48 rounded overflow-hidden' href="/#">
          <img
            alt='ecommerce'
            className='object-cover object-center w-full h-full block'
            src={props.item.link}
          />
        </a>
        <div className='mt-4'>
          <h2 className='text-gray-500 tracking-widest title-font mb-1'>
            Journey to the metaverse
          </h2>
          
          <h3 className="text-white title-font text-lg font-medium">{props.item.type}</h3>
          <p className=' text-white mt-10'>{props.item.edition}</p>
          <div className='flex items-center justify-between gap-x-3 my-10'>
            <button className='w-full md:w-1/2  rounded border-[#0dba88] border-2 text-[#0dba88]  text-base bg-[#1c1b1b] p-2 hover:bg-gray-700  hover:text-white bg-gray--500 active:bg-gray-700 focus:outline-none focus:ring focus:ring-cyan-300 shadow-lg shadow-cyan-700/50'
              onClick={e => unHardStaking(props.item.edition)}  disabled = {props.item.type ==="UnLocked NFT"? "disabled" : ""}
            >
              UnStake
            </button>
            <button className='w-full md:w-1/2 rounded bg-[#0dba88] text-white  border-[#0dba88] border-2  text-base p-2 hover:bg-[#0dba88]-500  hover:text-[#0dba88]-300 bg-gray--500 active:bg-gray-700 focus:outline-none focus:ring focus:ring-cyan-300 shadow-lg shadow-stone-700/50'
              onClick={e => hardStaking(props.item.edition)}  disabled = {props.item.type ==="Locked NFT"? "disabled" : ""}
            >
              Stake
            </button>
          </div>
        </div>
      </div>
    </div>

  )
}
export default Card
