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
    const payDate = now + 30 * 24 * 60 * 60;  
    const startDate = now; 
    const endDate = now + 365 * 24 * 60 * 60;
    const location = "34 rue Feutrier, 75018 Paris"

    const rentalContract = await hre.ethers.deployContract("Rental", [
      payDate, 
      expectedRent, 
      renter, 
      landlord,
      startDate,
      endDate,
      location,
    ]);

    return { rentalContract, owner, landlord, renter, expectedRent, payDate, endDate };
  }


// Test: paying wrong rent amount should return an error
it("should return an error if rent amount in wrong", async function()  {
  const { rentalContract, renter } = await loadFixture(deployRent);
  
  await expect(rentalContract.connect(renter).payRent({value: ethers.parseEther("0.5")})).to.be.revertedWith("Wrong rent amount");
})

// Test: paying on time with the right amount should increase the score by 10
it("should increase the score by 10 points if paid on time with right amount", async function() {
  const { rentalContract, renter, payDate } = await loadFixture(deployRent);

  await time.increaseTo(payDate - 1);  // 1 second before due
  const tx = await rentalContract.connect(renter).payRent({value: ethers.parseEther("1.0")});
  await expect(await rentalContract.connect(renter).getScore()).to.equal(110);

})
  // Test: paying late should decrease score by 1 points
it("should decrease score by 1 point if rent is paid late", async function()  {
  const { rentalContract, renter, payDate, owner} = await loadFixture(deployRent);

  await time.increaseTo(payDate + 60 * 60 * 24 * 10); // 10 days after payDate
  const tx = await rentalContract.connect(renter).payRent({value: ethers.parseEther("1.0")});
  await expect(await rentalContract.connect(renter).getScore()).to.equal(91);
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
    await expect(await rentalContract.connect(renter).getScore()).to.equal(69);
  })


  // Test: landord's wallet should be credited
  it("should credit the landlord's wallet with the rent ", async function()  {
    const { rentalContract, payDate, renter, landlord } = await loadFixture(deployRent);

    await time.increaseTo(payDate - 1);  // 1 second before due
    
    const landlordBalanceBefore = await ethers.provider.getBalance(landlord.address);

    await rentalContract.connect(renter).payRent({ value: ethers.parseEther("1.0") });

    const landlordBalanceAfter = await ethers.provider.getBalance(landlord.address);

    expect(landlordBalanceAfter - landlordBalanceBefore).to.equal(ethers.parseEther("1.0"));
  })

  // Test: should return a RentPaid event when the rent had been paid
  it("should send a RentPaid event when rent is paid", async function()  {
  const { rentalContract, renter } = await loadFixture(deployRent);
  const tx = await rentalContract.connect(renter).payRent({value: ethers.parseEther("1.0")});
  const receipt = await tx.wait();
  expect(receipt).to.emit(rentalContract, "RentPaid")
                    .withArgs(Date.now(), ethers.parseEther("1.0"), renter, true);
}) 

    // Test: should return a NewPayDate event when the rent had been paid
  it("should send a NewPayDate event when rent is paid", async function()  {
  const { rentalContract, renter } = await loadFixture(deployRent);
  const tx = await rentalContract.connect(renter).payRent({value: ethers.parseEther("1.0")});
  const receipt = await tx.wait();

  // Set new expected payDate 30 days after payment
  const newPaydDate = Date.now() + 30 * 24 * 60 * 60;
  expect(receipt).to.emit(rentalContract, "NewPayDate")
                    .withArgs(Date.now(), renter);
}) 

  // Get the full payment schedule after its creation
  it("should return the payment schedule after the contract is initialised", async function() {
    const { rentalContract, renter } = await loadFixture(deployRent); 
    const tx = await rentalContract.connect(renter).getPayments();

    expect(typeof tx).to.equal("object");
    // check for expected struct properties: onTime and paid
    expect(tx[0][1]).to.equal(false);
    expect(tx[0][2]).to.equal(false);

  })

  // Updated payment schedule after a few payments
  it("should return an updated payment schedule after a payment", async function() {
    const { rentalContract, renter } = await loadFixture(deployRent); 
    
    for (let i = 0; i < 3; i++) {
      await rentalContract.connect(renter).payRent({ value: ethers.parseEther("1.0") });
    }
    const tz = await rentalContract.connect(renter).getPayments();

    expect(typeof tz).to.equal("object");
    // check for expected struct properties: ontime and paid are true for first payment
    expect(tz[0][1]).to.equal(true);
    expect(tz[0][2]).to.equal(true);

    // true for 3rd payment
    expect(tz[2][1]).to.equal(true);
    expect(tz[2][2]).to.equal(true);

    // false for 4th payment
    expect(tz[3][1]).to.equal(false);
    expect(tz[3][2]).to.equal(false);
  })
  it("should verify the payment date in the payment schedule", async function() {
    const { rentalContract, renter } = await loadFixture(deployRent);
    const tx = await rentalContract.connect(renter).getPayments();

    // 2nd payment date should be startDate + 30 days
    const secPayment = await time.latest() + 60 * 24 * 60 * 60 -1;
    expect(tx[1][0]).to.equal(secPayment);
  })
})
