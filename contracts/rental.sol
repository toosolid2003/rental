// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

contract Rental {
    uint256 public score;
    uint256 internal expectedRent;
    uint256 internal payDate;
    address renter;
    address owner;

    constructor(uint _paydate, uint _expectedRent)  {
        payDate = _paydate;
        expectedRent = _expectedRent;
        }
    
    function payRent() public payable   {
        // Send money
        (bool success, ) = owner.call{value: msg.value}("");
        require(success, "Failed to send the rent");


        // verify date

        // update score accordingly

        // reset payDate ?
    }

    function updateScore(uint _points) internal {

    }

    function resetPayDate() internal {

    }

    function getScore() external    {

    }

    function sendNotice()   public  {

    }


//Contract end
}