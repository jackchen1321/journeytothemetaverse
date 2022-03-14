module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {},
    fontFamily: {
      'sans': ['"Roboto"', '"Sans-serif"'],
    },
    backgroundImage: {
      'backImg': "url('assets/images/backImg.gif')",
      'stakingBanner': "url('assets/images/2.png')",
      'amountBanner': "url('assets/images/1.png')",
      'withdrawBanner': "url('assets/images/3.png')",
    }
  },
  plugins: [],
}