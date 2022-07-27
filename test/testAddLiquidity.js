const hre = require("hardhat");
const { expect } = require("chai");
const { ethers } = require("hardhat");


const toWei = (value) => ethers.utils.parseEther(value.toString());

const fromWei = (value) =>
    ethers.utils.formatEther(
        typeof value === "string" ? value : value.toString()
    );

const getBalance = ethers.provider.getBalance;

describe("Exchange", () => {
    let owner;
    let user;
    let exchange;
    let token;

    beforeEach(async () => {
        [owner, user] = await ethers.getSigners();
        const Token = await ethers.getContractFactory("Token");
        token = await Token.deploy("Apple", "apple", toWei(10 ** 6));
        await token.deployed();

        const Exchange = await ethers.getContractFactory("Exchange");
        exchange = await Exchange.deploy(token.address);
        await exchange.deployed();
    })

    it("is deployed", async () => {
        expect(await exchange.deployed()).to.equal(exchange);
    });

    describe("Add Liquidity", async () => {
        it("should add liquidity", async () => {
            await token.approve(exchange.address, toWei(200));
            await exchange.addLiquidity(toWei(200), { value: toWei(100) });

            expect(await getBalance(exchange.address)).to.equal(toWei(100));
            expect(await exchange.getReserve()).to.equal(toWei(200));
        });
    });
})
