import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre, { ethers } from "hardhat";

describe("RentalScore", function () {
  // We define a fixture to reuse the same setup in every test.
  async function deployRent() {

    // Contracts are deployed using the first signer/account by default
    const [owner, landlord, renter] = await hre.ethers.getSigners();
    const now = await time.latest();
    const expectedRent = ethers.parseEther("1.0")
    const payDate = now + 30 * 24 * 60 * 60;  // Epoch value on 7/7/2025
    const startDate = now; 
    const endDate = now + 365 * 24 * 60 * 60; // Epoch value on 7/7/2027

    const rentalContract = await hre.ethers.deployContract("Rental", [
      payDate, 
      expectedRent, 
      renter, 
      startDate,
      endDate
    ]);

    return { rentalContract, owner, landlord, renter, expectedRent, payDate, endDate };
  }


// Test: paying wrong rent amount should return an error
it("should return an error if rent amount in wrong", async function()  {
  const { rentalContract, renter } = await loadFixture(deployRent);
  
  await expect(rentalContract.connect(renter).payRent({value: ethers.parseEther("0.5")})).to.be.revertedWith("Wrong rent amount");
})

// Test: paying on time with the right amount should keep the score intact
it("should leave the score intact if paid on time with right amount", async function() {
  const { rentalContract, renter, payDate } = await loadFixture(deployRent);

  await time.increaseTo(payDate - 1);  // 1 second before due
  const tx = await rentalContract.connect(renter).payRent({value: ethers.parseEther("1.0")});
  await expect(await rentalContract.getScore()).to.equal(100);

})
  // Test: paying late should decrease score by 1 points
it("should decrease score by 1 point if rent is paid late", async function()  {
  const { rentalContract, renter, payDate} = await loadFixture(deployRent);

  await time.increaseTo(payDate + 60 * 60 * 24 * 10); // 10 days after payDate
  const tx = await rentalContract.connect(renter).payRent({value: ethers.parseEther("1.0")});
  await expect(await rentalContract.getScore()).to.equal(91);
})

  // Test : should not accept payments after the lease ended
  it("should not allow payment after the lease ended", async function() {
    const { rentalContract, renter, endDate } = await loadFixture(deployRent);

    await time.increaseTo(endDate + 1); // 1 second after endDate
    await expect(rentalContract.connect(renter).payRent({value: ethers.parseEther("1.0")})
      ).to.be.revertedWith("The lease has expired");
  })

  // Test: did not pay the last month rent
  it("should punish renters who fail to pay rent ", async function()  {
    const { rentalContract, renter, payDate } = await loadFixture(deployRent);

    await time.increaseTo(payDate + 60*60*24*32); // 32 days after payDate
    const tx = await rentalContract.connect(renter).payRent({value:ethers.parseEther("1.0")});
    await expect(await rentalContract.getScore()).to.equal(69);
  })



// end of Describe
})


// Test: only the owner should be able to update the expiry date

//Test: renter should not be able to change the landlord'address

//Test: only the landlord should be able to change the rent amount

