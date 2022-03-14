// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts v4.3.2 (token/ERC20/ERC20.sol)

pragma solidity ^0.8.7;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
 
/**
 * @dev Interface for checking active staked balance of a user.
 */
interface IAURASource {
  function getAccumulatedHardStakeAmount(address staker) external view returns (uint256);
  function getAccumulatedPassiveStakeAmount(address _owner) external view returns (uint256);
}

/**
 * @dev Implementation of the {IERC20} interface.
 */
contract AURA is ERC20, ReentrancyGuard, Ownable {
    IAURASource public AURASource;

    uint256 public MAX_SUPPLY;
    uint256 public constant MAX_TAX_VALUE = 100;

    uint256 public spendTaxAmount;
    uint256 public withdrawTaxAmount;

    uint256 public bribesDistributed;
    uint256 public activeTaxCollectedAmount;

    bool public tokenCapSet;

    bool public withdrawTaxCollectionStopped;
    bool public spendTaxCollectionStopped;

    bool public isPaused;
    bool public isDepositPaused;
    bool public isWithdrawPaused;
    bool public isTransferPaused;

    mapping (address => bool) private _isAuthorised;
    address[] public authorisedLog;

    mapping(address => uint256) public depositedAmount;
    mapping(address => uint256) public spentAmount;

    modifier onlyAuthorised {
      require(_isAuthorised[_msgSender()], "Not Authorised");
      _;
    }

    modifier whenNotPaused {
      require(!isPaused, "Transfers paused!");
      _;
    }

    event Withdraw(address indexed userAddress, uint256 amount, uint256 tax);
    event Deposit(address indexed userAddress, uint256 amount);
    event DepositFor(address indexed caller, address indexed userAddress, uint256 amount);
    event Spend(address indexed caller, address indexed userAddress, uint256 amount, uint256 tax);
    event ClaimTax(address indexed caller, address indexed userAddress, uint256 amount);
    event InternalTransfer(address indexed from, address indexed to, uint256 amount);

    constructor(address _source) ERC20("$AURA", "AURA") {
      _isAuthorised[_msgSender()] = true;
      isPaused = true;
      isTransferPaused = true;

      withdrawTaxAmount = 25;
      spendTaxAmount = 25;

      AURASource = IAURASource(_source);
    }

    /**
    * @dev Returnes current spendable balance of a specific user. This balance can be spent by user for other collections without
    *      withdrawal to ERC-20 AURA OR can be withdrawn to ERC-20 AURA.
    */
    function getUserBalance(address user) public view returns (uint256) {
      return (AURASource.getAccumulatedHardStakeAmount(user) + AURASource.getAccumulatedPassiveStakeAmount(user) + depositedAmount[user] - spentAmount[user]);
    }

    /**
    * @dev Function to deposit ERC-20 AURA to the game balance.
    */
    function depositAURA(uint256 amount) public nonReentrant whenNotPaused {
      require(!isDepositPaused, "Deposit Paused");
      require(balanceOf(_msgSender()) >= amount, "Insufficient balance");

      _burn(_msgSender(), amount);
      depositedAmount[_msgSender()] += amount;

      emit Deposit(
        _msgSender(),
        amount
      );
    }

    /**
    * @dev Function to withdraw game AURA to ERC-20 AURA.
    */
    function withdrawAURA(uint256 amount) public nonReentrant whenNotPaused {
      require(!isWithdrawPaused, "Withdraw Paused");
      require(getUserBalance(_msgSender()) >= amount, "Insufficient balance");
      uint256 tax = withdrawTaxCollectionStopped ? 0 : (amount * withdrawTaxAmount) / 100;

      spentAmount[_msgSender()] += amount;
      activeTaxCollectedAmount += tax;
      _mint(_msgSender(), (amount - tax));

      emit Withdraw(
        _msgSender(),
        amount,
        tax
      );
    }

    /**
    * @dev Function to transfer game AURA from one account to another.
    */
    function transferAURA(address to, uint256 amount) public nonReentrant whenNotPaused {
      require(!isTransferPaused, "Transfer Paused");
      require(getUserBalance(_msgSender()) >= amount, "Insufficient balance");

      spentAmount[_msgSender()] += amount;
      depositedAmount[to] += amount;

      emit InternalTransfer(
        _msgSender(),
        to,
        amount
      );
    }

    /**
    * @dev Function to spend user balance. Can be called by other authorised contracts. To be used for internal purchases of other NFTs, etc.
    */
    function spendAURA(address user, uint256 amount) external onlyAuthorised nonReentrant {
      require(getUserBalance(user) >= amount, "Insufficient balance");
      uint256 tax = spendTaxCollectionStopped ? 0 : (amount * spendTaxAmount) / 100;

      spentAmount[user] += amount;
      activeTaxCollectedAmount += tax;

      emit Spend(
        _msgSender(),
        user,
        amount,
        tax
      );
    }

    /**
    * @dev Function to deposit tokens to a user balance. Can be only called by an authorised contracts.
    */
    function depositAURAFor(address user, uint256 amount) public onlyAuthorised nonReentrant {
      _depositAURAFor(user, amount);
    }

    /**
    * @dev Function to tokens to the user balances. Can be only called by an authorised users.
    */
    function distributeAURA(address[] memory user, uint256[] memory amount) public onlyAuthorised nonReentrant {
      require(user.length == amount.length, "Wrong arrays passed");

      for (uint256 i; i < user.length; i++) {
        _depositAURAFor(user[i], amount[i]);
      }
    }

    function _depositAURAFor(address user, uint256 amount) internal {
      require(user != address(0), "Deposit to 0 address");
      depositedAmount[user] += amount;

      emit DepositFor(
        _msgSender(),
        user,
        amount
      );
    }

    /**
    * @dev Function to mint tokens to a user balance. Can be only called by an authorised contracts.
    */
    function mintFor(address user, uint256 amount) external onlyAuthorised nonReentrant {
      if (tokenCapSet) require(totalSupply() + amount <= MAX_SUPPLY, "You try to mint more than max supply");
      _mint(user, amount);
    }

    /**
    * @dev Function to claim tokens from the tax accumulated pot. Can be only called by an authorised contracts.
    */
    function claimAURATax(address user, uint256 amount) public onlyAuthorised nonReentrant {
      require(activeTaxCollectedAmount >= amount, "Insufficiend tax balance");

      activeTaxCollectedAmount -= amount;
      depositedAmount[user] += amount;
      bribesDistributed += amount;

      emit ClaimTax(
        _msgSender(),
        user,
        amount
      );
    }

    /**
    * @dev Function returns maxSupply set by admin. By default returns error (Max supply is not set).
    */
    function getMaxSupply() public view returns (uint256) {
      require(tokenCapSet, "Max supply is not set");
      return MAX_SUPPLY;
    }

    /*
      ADMIN FUNCTIONS
    */

    /**
    * @dev Function allows admin to set total supply of AURA token.
    */
    function setTokenCap(uint256 tokenCup) public onlyOwner {
      require(totalSupply() < tokenCup, "Value is smaller than the number of existing tokens");
      require(!tokenCapSet, "Token cap has been already set");

      MAX_SUPPLY = tokenCup;
    }

    /**
    * @dev Function allows admin add authorised address. The function also logs what addresses were authorised for transparancy.
    */
    function authorise(address addressToAuth) public onlyOwner {
      _isAuthorised[addressToAuth] = true;
      authorisedLog.push(addressToAuth);
    }

    /**
    * @dev Function allows admin add unauthorised address.
    */
    function unauthorise(address addressToUnAuth) public onlyOwner {
      _isAuthorised[addressToUnAuth] = false;
    }

    /**
    * @dev Function allows admin update the address of staking address.
    */
    function changeAURASourceContract(address _source) public onlyOwner {
      AURASource = IAURASource(_source);
      authorise(_source);
    }

    /**
    * @dev Function allows admin to update limmit of tax on withdraw.
    */
    function updateWithdrawTaxAmount(uint256 _taxAmount) public onlyOwner {
      require(_taxAmount < MAX_TAX_VALUE, "Wrong value passed");
      withdrawTaxAmount = _taxAmount;
    }

    /**
    * @dev Function allows admin to update tax amount on spend.
    */
    function updateSpendTaxAmount(uint256 _taxAmount) public onlyOwner {
      require(_taxAmount < MAX_TAX_VALUE, "Wrong value passed");
      spendTaxAmount = _taxAmount;
    }

    /**
    * @dev Function allows admin to stop tax collection on withdraw.
    */
    function stopTaxCollectionOnWithdraw(bool _stop) public onlyOwner {
      withdrawTaxCollectionStopped = _stop;
    }

    /**
    * @dev Function allows admin to stop tax collection on spend.
    */
    function stopTaxCollectionOnSpend(bool _stop) public onlyOwner {
      spendTaxCollectionStopped = _stop;
    }

    /**
    * @dev Function allows admin to pause all in game AURA transfactions.
    */
    function pauseGameAURA(bool _pause) public onlyOwner {
      isPaused = _pause;
    }

    /**
    * @dev Function allows admin to pause in game AURA transfers.
    */
    function pauseTransfers(bool _pause) public onlyOwner {
      isTransferPaused = _pause;
    }

    /**
    * @dev Function allows admin to pause in game AURA withdraw.
    */
    function pauseWithdraw(bool _pause) public onlyOwner {
      isWithdrawPaused = _pause;
    }

    /**
    * @dev Function allows admin to pause in game AURA deposit.
    */
    function pauseDeposits(bool _pause) public onlyOwner {
      isDepositPaused = _pause;
    }

    /**
    * @dev Function allows admin to withdraw ETH accidentally dropped to the contract.
    */
    function rescue() external onlyOwner {
      payable(owner()).transfer(address(this).balance);
    }
}