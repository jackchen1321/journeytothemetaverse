import React, { useState, useEffect, Fragment, useRef } from 'react'
import { useBaseURI } from '../../hooks/GameFiContract'
import { useGetUserBalance, useWithdrawAURA } from '../../hooks/TokenContract'
import {
  useGetHardStakingTokens,
  useGetTotalStakedNFTs,
  useGetTotalHardStakers,
} from '../../hooks/StakingContract'
import { Dialog, Transition } from '@headlessui/react'
import AppLayout from '../AppLayout'
import { toast } from 'react-toastify'
import CardList from './CardList'
import { useEthers } from '@usedapp/core'
import { useMoralisWeb3Api } from 'react-moralis'
import axios from 'axios'
import './Home.scss'
import { ContractAddressByRinkeby } from '../../contracts'
import { Loading } from '../../components/Loading/Loading'

const Home = () => {
  const [nftsList, setNftsList] = useState([])
  const [amount, setAmount] = useState([])
  const { account } = useEthers()
  const [open, setOpen] = useState(false)
  const cancelButtonRef = useRef(null)
  const lockNFTList = useGetHardStakingTokens(account)
  const totalStackedNFT = useGetTotalStakedNFTs()
  const totalHardStakers = useGetTotalHardStakers()
  const [loadingFlag, setLoadingFlag] = useState(false)
  const Web3Api = useMoralisWeb3Api()

  const nfts = async () => {
    console.log(account, ContractAddressByRinkeby)
    const options = {
      // chain: 'ropsten',
      chain: 'eth',
      address: account,
      token_address: ContractAddressByRinkeby,
    }
    console.log('---moralis---->')

    const result = await Web3Api.account.getNFTsForContract(options)
    console.log('result-->', result)
    return result
  }

  const fixURL = (url) => {
    if (url.startsWith('ipfs')) {
      return (
        'https://ipfs.io/ipfs/' + url.split('ipfs://').slice(-1)[0]
        // .substring(0, url.split('ipfs://').slice(-1)[0].length - 1)
      )
    } else {
      return url + '?format=json'
    }
  }
  const makeLinkURL = (url) => {
    if (url.startsWith('ipfs')) {
      return (
        'https://ipfs.io/ipfs/' +
        url.split('ipfs://').slice(-1)[0].split('png')[0] +
        'gif'
      )
    } else {
      return url + '?format=json'
    }
  }

  const baseURI = useBaseURI()

  const getJsonData = async (url, index) => {
    try {
      const response = await axios.get(fixURL(url) + index + '.json')
      return {
        attributes: response.data.attributes,
        dna: response.data.dna,
        date: response.data.date,
        description: response.data.description,
        edition: response.data.edition,
        image: response.data.image,
        name: response.data.name,
        link: makeLinkURL(response.data.image),
        type: '',
      }
    } catch (ex) {
      //console.log(ex)
      return null
    }
  }
  const setNFTList = async () => {
    const nftList = await nfts()
    console.log('nftList', nftList)
    let nsList = []
    setNftsList([])
    for (let nft of nftList.result) {
      console.log('---->')
      console.log(nft)
      console.log('baseURI------->', baseURI)

      if (baseURI) {
        const json = await getJsonData(baseURI[0], nft.token_id)
        console.log('json : ', json)
        json['type'] = 'UnLocked NFT'
        nsList.push(json)
      }
    }

    console.log('here: ', lockNFTList)
    const lockStakes = lockNFTList

    if (!lockStakes) return

    for (let nft of lockStakes) {
      for (let item of nft) {
        const json = await getJsonData(baseURI[0], item)
        json['type'] = 'Locked NFT'
        nsList.push(json)
      }
    }
    setNftsList(nsList)
    console.log(nsList)
  }

  const { state: withDrawState, send: withdrawAURA } = useWithdrawAURA()

  const withDraw = async () => {
    try {
      if (amount === 0) {
        toast.error('amount must not 0', {
          position: toast.POSITION.TOP_RIGHT,
          autoClose: 2000,
        })
        return
      }
      setLoadingFlag(true)
      setOpen(false)
      setAmount(0)
      await withdrawAURA(amount)
      setLoadingFlag(false)
      toast.success('success', {
        position: toast.POSITION.TOP_RIGHT,
        autoClose: 2000,
      })
    } catch (e) {
      console.log('eeeeee', e)
      setLoadingFlag(false)
      toast.error('error_mmm', {
        position: toast.POSITION.TOP_RIGHT,
        autoClose: 2000,
      })
    }
  }
  const closeWithDraw = () => {
    setOpen(false)
    setAmount(0)
  }
  const getUserBalance = useGetUserBalance(account)

  useEffect(() => {
    if (account) {
      withDrawState.status === 'Exception' &&
        toast.error('error', {
          position: toast.POSITION.TOP_RIGHT,
          autoClose: 5000,
        })
      setNFTList()
    }
  }, [account, lockNFTList])
  // }, [account])

  if (loadingFlag) {
    return <Loading />
  }

  return (
    <AppLayout className=''>
      <main className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 flex flex-col items-center justify-center gap-y-10'>
        <div className='py-10 text-center w-full flex flex-wrap  items-center justify-between  gap-y-2 '>
          <div className='bg-stakingBanner bg-[length:100%_100%]  basis-[100%]  md:basis-[48%] px-10  py-5  flex flex-col text-center gap-5 rounded-2xl  shadow-lg shadow-gray-700/50'>
            <span className='text-[30px] font-semibold text-white'>
              {account ? parseInt(totalStackedNFT, 10).toString() : ''}
            </span>
            <span className='font-normal text-white mb-5 text-[20px]'>
              Total Locked NFTs
            </span>
          </div>
          <div className='bg-stakingBanner bg-[length:100%_100%] basis-[100%] md:basis-[48%] px-10 py-5 flex flex-col text-center gap-5 rounded-2xl  shadow-lg shadow-gray-700/50'>
            <span className='text-[30px] font-semibold text-white'>
              {account ? parseInt(totalHardStakers, 10).toString() : ''}
            </span>
            <span className='font-normal text-white mb-5 text-[20px]'>
              Number of Stakers
            </span>
          </div>
        </div>
        <div className='bg-amountBanner bg-[length:100%_100%]  py-5 text-center w-full rounded-2xl  shadow-lg shadow-gray-700/50'>
          <ul className=''>
            <li className=' text-white text-[30px] font-bold mt-5 mb-[20px] tracking-[0.05em]'>
              Your Rewards
            </li>
            <li className='text-[20px] font-bold text-white mb-5'>
              <span className='text-[32px]'>
                {account ? parseInt(getUserBalance, 10).toString() : ''}
              </span>
              <span className='ml-2'>AURA</span>
            </li>
          </ul>
        </div>
        {nftsList && <CardList nfts={nftsList} />}

        <div className=' pt-10 pb-20 text-center w-full flex flex-wrap  items-center justify-between gap-y-10'>
          <button
            className='bg-withdrawBanner bg-[length:100%_100%] w-full text-lg font-bold rounded-2xl text-white py-5  hover:text-xl  focus:outline-none focus:ring focus:ring-indigo-300 shadow-lg shadow-indigo-700/50'
            onClick={() => (account ? setOpen(true) : '')}
          >
            WITHDRAW
          </button>
        </div>

        <Transition.Root show={open} as={Fragment}>
          <Dialog
            as='div'
            className='fixed z-10 inset-0 overflow-y-auto'
            initialFocus={cancelButtonRef}
            onClose={setOpen}
          >
            <div className='flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0'>
              <Transition.Child
                as={Fragment}
                enter='ease-out duration-300'
                enterFrom='opacity-0'
                enterTo='opacity-100'
                leave='ease-in duration-200'
                leaveFrom='opacity-100'
                leaveTo='opacity-0'
              >
                <Dialog.Overlay className='fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity' />
              </Transition.Child>

              <span
                className='hidden sm:inline-block sm:align-middle sm:h-screen'
                aria-hidden='true'
              >
                &#8203;
              </span>
              <Transition.Child
                as={Fragment}
                enter='ease-out duration-300'
                enterFrom='opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95'
                enterTo='opacity-100 translate-y-0 sm:scale-100'
                leave='ease-in duration-200'
                leaveFrom='opacity-100 translate-y-0 sm:scale-100'
                leaveTo='opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95'
              >
                <div className='inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full'>
                  <div className='bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4'>
                    <div className='sm:flex sm:items-start'>
                      <div className='mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left'>
                        <Dialog.Title
                          as='h3'
                          className='text-lg leading-6 font-medium text-gray-900'
                        >
                          Please set the amount of withdraw.
                        </Dialog.Title>
                        <div className='flex flex-col justify-center items-center'>
                          <div className='mt-2 w-full'>
                            <input
                              type='number'
                              value={amount}
                              onChange={(e) => setAmount(e.target.value)}
                              className=' focus:ring-indigo-50 block w-full border-2 border-gray-500 focus:border-gray-900  py-2 text-lg sm:text-sm rounded-md my-5'
                              placeholder='Please set the amount of withdraw'
                            />
                          </div>
                          <div className='mt-2 w-full'>
                            <p className='text-sm text-gray-500'>
                              Are you sure to confirm withDraw?
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className='bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse'>
                    <button
                      type='button'
                      className='w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-cyan-600 text-base font-medium text-white hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 sm:ml-3 sm:w-auto sm:text-sm'
                      onClick={withDraw}
                    >
                      Confirm
                    </button>
                    <button
                      type='button'
                      className='mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm'
                      onClick={closeWithDraw}
                      ref={cancelButtonRef}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </Transition.Child>
            </div>
          </Dialog>
        </Transition.Root>
      </main>
    </AppLayout>
  )
}

export default Home
