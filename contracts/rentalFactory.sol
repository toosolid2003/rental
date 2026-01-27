// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;
import { Rental } from "./rental.sol";

contract LeaseFactory   {
    // Tracks leases by tenant and landlord
    mapping(address => address[]) public leaseByTenant;
    mapping(address => address[]) public leaseByLandlord;

    event LeaseCreated(address indexed tenant, address indexed landlord, address leaseContract);

    function createLease(
        uint256 _payDate,
        uint256 _expectedRent,
        address _tenant,
        address _landlord,
        uint256 _startDate,
        uint256 _endDate,
        string memory _loc

    ) external returns (address) {
        
        require(_tenant != address(0) && _landlord != address(0), "Invalid address");
        require(_startDate < _endDate, "Start date should be before end date");
        require(_expectedRent > 0, "Rent should be >0");

        Rental lease = new Rental(_payDate, _expectedRent, _tenant, _landlord, _startDate, _endDate, _loc);

        leaseByTenant[_tenant].push(address(lease));
        leaseByLandlord[_landlord].push(address(lease));

        emit LeaseCreated(_tenant, _landlord, address(lease));

        return address(lease);
    }

    function getLeasesByTenant(address _tenant) external view returns(address[] memory)  {
        return leaseByTenant[_tenant];
    }

    function getLeasesByLandlord(address _landlord) external view returns(address[] memory)  {
        return leaseByLandlord[_landlord];
    }
}