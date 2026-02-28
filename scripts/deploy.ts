import hre from "hardhat";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const { ethers } = hre as any;

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying Plinko with account:", deployer.address);
  console.log(
    "Account balance:",
    ethers.formatEther(await ethers.provider.getBalance(deployer.address)),
    "MON"
  );

  // Deploy with 0.1 MON as initial house balance
  const Plinko = await ethers.getContractFactory("Plinko");
  const plinko = await Plinko.deploy({ value: ethers.parseEther("0.1") });

  await plinko.waitForDeployment();

  const address = await plinko.getAddress();
  console.log("\n✅ Plinko deployed to:", address);
  console.log(
    "   Contract balance:",
    ethers.formatEther(await ethers.provider.getBalance(address)),
    "MON"
  );
  console.log("\n👉 Copy this into your .env.local:");
  console.log(`   NEXT_PUBLIC_CONTRACT_ADDRESS=${address}`);
  console.log(
    "\n🔍 View on explorer: https://testnet.monadexplorer.com/address/" + address
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
