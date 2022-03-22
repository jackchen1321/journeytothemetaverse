module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {},
    fontFamily: {
      sans: ['"Roboto"', '"Sans-serif"'],
    },
    backgroundImage: {
      backImg: "url('assets/images/backImg.gif')",
      stakingBanner: "url('assets/images/2.png')",
      amountBanner: "url('assets/images/1.png')",
      withdrawBanner: "url('assets/images/withdraw_background.png')",
      stakingButton: "url('assets/images/staking_button_background.png')",
      unstakingButton: "url('assets/images/unstaking_button_background.png')",
      stake: "url('assets/images/stake_background.png')",
      stakingBorder: "url('assets/images/staking_border.png')",
      multistake: "url('assets/images/stake_background.png')",
    },
  },
  plugins: [],
};
