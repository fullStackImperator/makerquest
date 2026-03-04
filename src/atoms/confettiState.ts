import { atom } from 'recoil'

export const confettiState = atom({
  key: 'confettiState',
  default: {
    isOpen: false,
  },
})
