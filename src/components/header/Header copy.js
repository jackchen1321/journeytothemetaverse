import { useEthers, shortenAddress, Mainnet, Ropsten } from '@usedapp/core';
import { toast } from 'react-toastify';
import WalletConnectProvider from '@walletconnect/web3-provider';
import Web3Modal from 'web3modal';
import 'react-toastify/dist/ReactToastify.css';
import './Header.scss';

const Header = () => {
  const { account, activate, chainId, deactivate } = useEthers();

  const handleConnect = async () => {
    const providerOptions = {
      injected: {
        display: {
          name: 'Metamask',
          description: 'Connect with the provider in your Browser',
        },
        package: null,
      },
      walletconnect: {
        package: WalletConnectProvider,
        options: {
          infuraId: process.env.REACT_APP_INFURA_ID,
        },
      },
    };

    if (!account) {
      const web3Modal = new Web3Modal({
        providerOptions,
      });
      const provider = await web3Modal.connect();
      await activate(provider);
    }
  };
  return (
    <header className='flex w-full justify-center py-3'>
      {!account ? (
        <button
          className='flex items-center px-4 py-3 text-white bg-blue-500 hover:bg-blue-400'
          onClick={handleConnect}
        >
          Connect
        </button>
      ) : (
        <button
          className='flex items-center px-4 py-3 text-white bg-blue-500 hover:bg-blue-400'
          onClick={() => deactivate()}
        >
          {shortenAddress(account)}
        </button>
      )}
    </header>
  );
};

export default Header;
