// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;


import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Rental is ReentrancyGuard, Ownable {
    
    // Variables
    uint256 private expectedRent;
    uint256 public payDate;
    uint256 public startDate;
    uint256 public endDate;
    uint256 private score;

    address private renter;
    address private landlord;

    // Modifiers
    modifier onlyWallets()  {
        require(msg.sender == renter || msg.sender == landlord, "Wallet not allowed");
        _;
    }

    modifier onlyLandlord() {
        require(msg.sender == landlord, "Only the landlord is allowed to perform this operation");
        _;
    }
    
    // Events
    event RentPaid(uint payDate, uint amount, address indexed renter);
    event ScoreUpdated(uint penalty, uint indexed newScore);

    event NewPayDate(uint indexed payDate, address indexed renter);
    event NewEnd(uint indexed endDate, address owner);
    event RentUpdate(uint indexed newRent, address landlord);

    constructor(uint _payDate, uint _expectedRent, address _renter, address _landlord, uint _startDate, uint _endDate) Ownable(_renter) {
        payDate = _payDate; // Initialize with 1st paydate, the next month.
        expectedRent = _expectedRent;
        renter = _renter;
        landlord = _landlord;
        score = 80;
        startDate = _startDate;
        endDate = _endDate;
    }
    
    function payRent() external payable nonReentrant {

       // TODO: anonimize the payment with ZK + make anonimity composable? 

        // Only allow one address to pay the rent
        require(msg.sender == renter, "Payer not allowed");

        // Check if the amount paid matches the expected amount
        require(msg.value == expectedRent, "Wrong rent amount");
        require(block.timestamp <= endDate, "The lease has expired");


        
        // After rent is received, send money to the landlord's wallet directly
        (bool success, ) = landlord.call{value: msg.value}("");
        require(success, "Failed to send the rent");
        emit RentPaid(payDate, msg.value, renter);

        // Once rent paid, update score, update paydate and emit event
        updateScore(1); // Margin set to 1 days after due date
        payDate = payDate + 30 days;
        emit NewPayDate(payDate, renter);

    }

    function updateScore(uint _margin) internal {
        // _margin specifies the tolerance in days

        // verify date
        uint256 highDate = payDate + (_margin * 1 days);
 

        // if(block.timestamp >= highDate)    {
            //Option 1: Decrease score by 1 point per day
            // uint256 penalty = (block.timestamp - highDate) / 1 days;

            // if(score < penalty) {
            //     score = 0;
            // } else {
            //     {
            //         score -= penalty;
            //     }
            // }
            // emit ScoreUpdated(penalty, score);

            // Option 2: add 10 points each timne the rent is within specified margin

        // }
        if (block.timestamp <= highDate)    {
            score += 10;
        }
    }

    function getLandlord()  public view onlyWallets returns(address)    {
        return landlord;
    }

    function getScore() public view onlyWallets returns(uint256)    {
        return score;
    }

    function checkRent() external view onlyWallets returns(uint256) {
        return expectedRent;
    }
 
    function sendNotice() public onlyWallets  {
        // Add logic for notice if needed

    }

    // Landlord specific functions

    function updateExpiry(uint _newDate) public onlyLandlord  {
        endDate = _newDate;
        emit NewEnd(endDate, msg.sender);
    }

   function updateRent(uint _newRent) public onlyLandlord {

    expectedRent = _newRent;
    emit RentUpdate(_newRent, msg.sender);
   } 

//Contract end
}