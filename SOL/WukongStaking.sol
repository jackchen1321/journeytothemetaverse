// SPDX-License-Identifier: MIT
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

pragma solidity ^0.8.7;

contract WukongStaking is Ownable, ReentrancyGuard {
    IERC721 public WukongNFT;

    uint256 public constant SECONDS_IN_DAY = 24 * 60 * 60;
    uint256 public HARDSTAKE_YIELD_PERDAY = 15;
    uint256 public PASSIVESTAKE_YIELD_PERDAY = 5;

    uint256 public stakingStartPoint;

    address[] public authorisedLog;

    bool public stakingLaunched;
    bool public depositPaused;
    uint256 public totalHardStaker;
    uint256 public totalStakedNFT;
    
    struct HardStaker {
        uint256 accumulatedAmount;
        uint256 lastCheckpoint;
        uint256[] hardStakedWukongId; 
    }

    struct PassiveStaker {
        uint256 lastCheckPoint;
        uint256 accumulatedAmount;
    }

    mapping(address => PassiveStaker) private _passiveStakers;
    mapping(address => HardStaker) private _hardStakers;
    mapping(uint256 => address) private _ownerOfHardStakingToken;
    mapping (address => bool) private _authorised;

    constructor(
        address _wukong,
        uint256 _stakingStartPoint
    ) {
        WukongNFT = IERC721(_wukong);
        stakingStartPoint = _stakingStartPoint;
    }

    modifier authorised() {
        require(_authorised[_msgSender()], "The token contract is not authorised");
            _;
    }

    function getHardStakingTokens(address _owner) public view returns (uint256[] memory) {
        return _hardStakers[_owner].hardStakedWukongId;
    }

    function hardStake(uint256 tokenId) external returns (bool) {
        address _sender = _msgSender();
        require(WukongNFT.ownerOf(tokenId) == _sender, "Not owner");
        
        HardStaker storage user = _hardStakers[_sender];

        accumulatePassiveStake(_sender);

        WukongNFT.safeTransferFrom(_sender, address(this), tokenId);
        _ownerOfHardStakingToken[tokenId] = _sender;

        accumulateHardStake(_sender);

        user.hardStakedWukongId.push(tokenId);
        if (user.hardStakedWukongId.length == 1) {
            totalHardStaker += 1;
        }
        totalStakedNFT += 1;

        return true;
    }

    function unHardStake(uint256 tokenId) external returns (bool) {
        address sender = _msgSender();
        require(_ownerOfHardStakingToken[tokenId] == sender, "Not owner of the staking NFT");
        
        HardStaker storage user = _hardStakers[sender];

        accumulatePassiveStake(sender);

        accumulateHardStake(sender);

        WukongNFT.safeTransferFrom(address(this), sender, tokenId);
        _ownerOfHardStakingToken[tokenId] = address(0);

        user.hardStakedWukongId = _moveTokenInTheList(user.hardStakedWukongId, tokenId);
        user.hardStakedWukongId.pop();

        if (user.hardStakedWukongId.length == 0) {
            totalHardStaker -= 1;
        }
        totalStakedNFT -= 1;

        return true;
    }

    function getAccumulatedHardStakeAmount(address staker) external view returns (uint256) {
        return _hardStakers[staker].accumulatedAmount + getCurrentHardStakeReward(staker);
    }
    
    function getAccumulatedPassiveStakeAmount(address _owner) external view returns (uint256) {
        return _passiveStakers[_owner].accumulatedAmount + getPassiveStakeReward(_owner);
    }

    function accumulatePassiveStake(address _owner) internal {
        _passiveStakers[_owner].accumulatedAmount += getPassiveStakeReward(_owner);
        _passiveStakers[_owner].lastCheckPoint = block.timestamp;
    }

    function accumulateHardStake(address staker) internal {
        _hardStakers[staker].accumulatedAmount += getCurrentHardStakeReward(staker);
        _hardStakers[staker].lastCheckpoint = block.timestamp;
    }

    function getCurrentHardStakeReward(address staker) internal view returns (uint256) {
        HardStaker memory user = _hardStakers[staker];

        // return (block.timestamp - user.lastCheckpoint);

        if (user.lastCheckpoint == 0 || block.timestamp < stakingStartPoint) {return 0;}

        return (block.timestamp - user.lastCheckpoint) / SECONDS_IN_DAY * user.hardStakedWukongId.length * HARDSTAKE_YIELD_PERDAY;
    }

    function getPassiveStakeReward(address _owner) internal view returns (uint256) {
        uint256 nftAmount = WukongNFT.balanceOf(_owner);

        uint256 startPoint = stakingStartPoint;
        if (_passiveStakers[_owner].lastCheckPoint != 0) {
            startPoint = _passiveStakers[_owner].lastCheckPoint;
        }

        return (block.timestamp - startPoint) / SECONDS_IN_DAY * nftAmount * PASSIVESTAKE_YIELD_PERDAY;
    }

    /**
    * @dev Returns token owner address (returns address(0) if token is not inside the gateway)
    */
    function ownerOf(uint256 tokenID) public view returns (address) {
        return _ownerOfHardStakingToken[tokenID];       
    }

    /**
    * @dev Admin function to authorise the contract address
    */
    function authorise(address toAuth) public onlyOwner {
        _authorised[toAuth] = true;
        authorisedLog.push(toAuth);
      }

    /**
    * @dev Function allows admin add unauthorised address.
    */
    function unauthorise(address addressToUnAuth) public onlyOwner {
        _authorised[addressToUnAuth] = false;
    }
  
    function emergencyWithdraw(uint256[] memory tokenIDs) public onlyOwner {
        require(tokenIDs.length <= 50, "50 is max per tx");
        pauseDeposit(true);

        for (uint256 i; i < tokenIDs.length; i++) {
            address receiver = _ownerOfHardStakingToken[tokenIDs[i]];

            if (receiver != address(0) && IERC721(WukongNFT).ownerOf(tokenIDs[i]) == address(this)) {
                IERC721(WukongNFT).transferFrom(address(this), receiver, tokenIDs[i]);
                // emit WithdrawStuckERC721(receiver, WukongNFT, tokenIDs[i]);
              }
        }
    }

    function _moveTokenInTheList(uint256[] memory list, uint256 tokenId) internal pure returns (uint256[] memory) {
        uint256 tokenIndex = 0;
        uint256 lastTokenIndex = list.length - 1;
        uint256 length = list.length;
  
        for(uint256 i = 0; i < length; i++) {
          if (list[i] == tokenId) {
            tokenIndex = i + 1;
            break;
          }
        }
        require(tokenIndex != 0, "msg.sender is not the owner");
  
        tokenIndex -= 1;
  
        if (tokenIndex != lastTokenIndex) {
          list[tokenIndex] = list[lastTokenIndex];
          list[lastTokenIndex] = tokenId;
        }
  
        return list;
      }


    /**
    * @dev Function allows to pause deposits if needed. Withdraw remains active.
    */
    function pauseDeposit(bool _pause) public onlyOwner {
        depositPaused = _pause;
      }
  
    
    function launchStaking() public onlyOwner {
        require(!stakingLaunched, "Staking has been launched already");
        stakingLaunched = true;
        // acceleratedYield = block.timestamp + (SECONDS_IN_DAY * HARDSTAKE_YIELD_PERDAY);
    }

    function onERC721Received(address, address, uint256, bytes calldata) external pure returns(bytes4){
        return bytes4(keccak256("onERC721Received(address,address,uint256,bytes)"));
    }
}