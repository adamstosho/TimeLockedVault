import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const tokenName = "DLTAfrica Token";
const tokenSymbol = "DLT";

const ERC20TokenModule = buildModule("ERC20TokenModule", (m) => {   
    const erc20TokenName = m.getParameter("erc20TokenName", tokenName);
    const erc20TokenSymbol = m.getParameter("erc20TokenSymbol", tokenSymbol);

    const erc20Token = m.contract("ERC20Token", [
        erc20TokenName, 
        erc20TokenSymbol
    ]);

    return { erc20Token };
});

export default ERC20TokenModule;