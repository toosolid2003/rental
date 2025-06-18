// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;


import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract Rental is ReentrancyGuard {
    uint256 public expectedRent;
    uint256 public payDate;
    uint256 public score;
    address renter;
    address owner;


    event RentPaid(uint payDate, uint amount, address indexed renter);

    constructor(uint _payDate, uint _expectedRent, address _renter)  {
        payDate = _payDate;
        expectedRent = _expectedRent;
        renter = _renter;
        }
    
    function payRent() public payable nonReentrant  {

        require(msg.sender == renter, "Payer not allowed");
        require(msg.value == expectedRent, "Wrong rent amount");
        require(block.timestamp >= payDate - 5 days, 'Payment is too earlt');

        // Send money
        (bool success, ) = owner.call{value: msg.value}("");
        require(success, "Failed to send the rent");

        emit RentPaid(payDate, msg.value, renter);

        updateScore(1);
        resetPayDate();

    }

    function updateScore(uint _margin) internal {
        // _margin specifies the tolerance in days

        // verify date
        uint256 lowDate = payDate - (_margin * 1 days);
        uint256 highDate = payDate + (_margin * 1 days);

        if(block.timestamp <= highDate && block.timestamp >= lowDate)   {
            
            //Increase score by 10 points
            unchecked   {
                score += 10;
            }
            
        }

        else if(block.timestamp > highDate) {
            // Rent is paid too late
            unchecked   {
                score -= 30;
            }
            
        }
    }

    function resetPayDate() internal {
        payDate = payDate + 30 days;

    }

    function sendNotice()   public  {

    }


//Contract end
}