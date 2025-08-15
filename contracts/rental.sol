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
    mapping(address => bytes32[]) public attestationsByTenant;
    
    struct Payment{
        uint256 date;
        bool paid;
    }

    Payment[] public paymentSchedule;

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
    event RentPaid(uint payDate, uint amount, address indexed renter, bool onTime);
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

        populateSchedule(_payDate, _endDate);
    }

    function populateSchedule(uint256 pd, uint256 endLease) public {
        // loop: start at firstPayDate, assign a "false" then continue until the next firstPayDate is superior
        // to endLease
        
        while(pd <= endLease)   {
            paymentSchedule.push(Payment({ date: pd, paid: false}));
            pd += 30 days;
        }

    } 
    function payRent() external payable nonReentrant {

       // Declare a memory variable to know if rent is paid on time 
        bool on_time;

        // Only allow one address to pay the rent
        require(msg.sender == renter, "Payer not allowed");

        // Check if the amount paid matches the expected amount
        require(msg.value == expectedRent, "Wrong rent amount");
        require(block.timestamp <= endDate, "The lease has expired");


        
        // After rent is received, send money to the landlord's wallet directly
        (bool success, ) = landlord.call{value: msg.value}("");
        require(success, "Failed to send the rent");

        // Once rent paid, update score 
        on_time = updateScore(1); // Margin set to 1 days after due date. Returns bool: on_time or not.

        // Adjust next pay date
        // TODO: update with the new paymentSchedule mapping
        // 1. Get all paydates with "false"
        // 2. Get the lowest pay date
        // 3. Update it to "true"

        payDate = payDate + 30 days;
        emit NewPayDate(payDate, renter);

        // Emit evenut
        emit RentPaid(payDate, msg.value, renter, on_time);
        


    }

    function updateScore(uint _margin) internal returns (bool){
        // _margin specifies the tolerance in days

        // verify date
        uint256 highDate = payDate + (_margin * 1 days);
 

        if(block.timestamp >= highDate)    {

            uint256 penalty = (block.timestamp - highDate) / 1 days;

            if(score < penalty) {
                score = 0;
            } else {
                {
                    score -= penalty;
                }
            }
            
            // Return false if rent not paid on time
            return false;

        }
        
        else  {
            score += 10;

            // Return true is rent paid on time
            return true;
        }
    }

    // Store the attestation, it's generated in the front-end via the EAS SDK
    function storeAttestation(bytes32 attestationId) external onlyWallets()  {
        attestationsByTenant[msg.sender].push(attestationId);
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