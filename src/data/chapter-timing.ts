/**
 * Per-chapter audio: the local files the read-along prefers, and the
 * published file each one was made from.
 *
 * `publishedUrl` is pinned rather than derived. The site builds that URL from
 * a hash of the narration text, which only a build with credentials resolves,
 * so without it a contributor clone would have word timings and nothing to
 * play. Pinning the URL lets any clone hear the same narration these timings
 * were measured against.
 *
 * All three fields describe one recording. A TTS re-render invalidates the
 * whole file at once: `pipeline.py --check-remote` in `atlas-podcast` reports
 * when the published audio has moved, and regenerating the timings is the
 * same operation as refreshing these URLs.
 */
export type SectionTiming = {
  audioUrl: string
  wordsUrl: string
  publishedUrl: string
}

const chapterTimings: Record<number, Record<number, SectionTiming>> = {
  1: {
    1: {
      audioUrl: '/audio/ch1/ch1-s1.mp3',
      wordsUrl: '/audio/ch1/ch1-s1.words.json',
      publishedUrl: 'https://atlas.foreviewusercontent.com/audio/atlas-ch1-s1-8a5836a6ac014cbb7fc5df3820c5dfdfa8c0f5ed9361b88da5e1b9a5442f980f.mp3',
    },
    2: {
      audioUrl: '/audio/ch1/ch1-s2.mp3',
      wordsUrl: '/audio/ch1/ch1-s2.words.json',
      publishedUrl: 'https://atlas.foreviewusercontent.com/audio/atlas-ch1-s2-9b0f275664522871f07fbec826917a64373327e7bd8e749e62ad95756248fe13.mp3',
    },
    3: {
      audioUrl: '/audio/ch1/ch1-s3.mp3',
      wordsUrl: '/audio/ch1/ch1-s3.words.json',
      publishedUrl: 'https://atlas.foreviewusercontent.com/audio/atlas-ch1-s3-cbfc6e12ff487f39bb78aec9c72cb85e6617e1339f214bc2739da66fa9536050.mp3',
    },
    4: {
      audioUrl: '/audio/ch1/ch1-s4.mp3',
      wordsUrl: '/audio/ch1/ch1-s4.words.json',
      publishedUrl: 'https://atlas.foreviewusercontent.com/audio/atlas-ch1-s4-ad67bfda80c99d1044eb0fd8f97765b7337d0a7f93d7e49ac11001260af7d123.mp3',
    },
    5: {
      audioUrl: '/audio/ch1/ch1-s5.mp3',
      wordsUrl: '/audio/ch1/ch1-s5.words.json',
      publishedUrl: 'https://atlas.foreviewusercontent.com/audio/atlas-ch1-s5-0bbe8ac41033408878cf0b5454d5ca0ead6891f880e04d3d1804c8d450958978.mp3',
    },
    6: {
      audioUrl: '/audio/ch1/ch1-s6.mp3',
      wordsUrl: '/audio/ch1/ch1-s6.words.json',
      publishedUrl: 'https://atlas.foreviewusercontent.com/audio/atlas-ch1-s6-4b28b9317e94e609e15ca19b6ab61331e9d24416092df24fc84029f46e9b7fba.mp3',
    },
    7: {
      audioUrl: '/audio/ch1/ch1-s7.mp3',
      wordsUrl: '/audio/ch1/ch1-s7.words.json',
      publishedUrl: 'https://atlas.foreviewusercontent.com/audio/atlas-ch1-s7-15556217745ebcbfddca5e9a1b9763d7703db3d11580d17f765191377bf25f3e.mp3',
    },
    8: {
      audioUrl: '/audio/ch1/ch1-s8.mp3',
      wordsUrl: '/audio/ch1/ch1-s8.words.json',
      publishedUrl: 'https://atlas.foreviewusercontent.com/audio/atlas-ch1-s8-7e5fa4732a8a156817aeb5d0fd523d37bce64eeaaa9db8154de3130e03a0f7f2.mp3',
    },
    9: {
      audioUrl: '/audio/ch1/ch1-s9.mp3',
      wordsUrl: '/audio/ch1/ch1-s9.words.json',
      publishedUrl: 'https://atlas.foreviewusercontent.com/audio/atlas-ch1-s9-edc893473eaef3e9f37e17e0fccfcb964807541d39a921734ffa8b93613eb169.mp3',
    },
    10: {
      audioUrl: '/audio/ch1/ch1-s10.mp3',
      wordsUrl: '/audio/ch1/ch1-s10.words.json',
      publishedUrl: 'https://atlas.foreviewusercontent.com/audio/atlas-ch1-s10-a650d1b5f2b9ab719ba78e60124d71c1c753ca6f8856367fd6b2364faf53b05d.mp3',
    },
    11: {
      audioUrl: '/audio/ch1/ch1-s11.mp3',
      wordsUrl: '/audio/ch1/ch1-s11.words.json',
      publishedUrl: 'https://atlas.foreviewusercontent.com/audio/atlas-ch1-s11-7683f418ed05758dad588cddbba6cd343853fb647d7b6417501c74b848004628.mp3',
    },
  },
  2: {
    1: {
      audioUrl: '/audio/ch2/ch2-s1.mp3',
      wordsUrl: '/audio/ch2/ch2-s1.words.json',
      publishedUrl: 'https://atlas.foreviewusercontent.com/audio/atlas-ch2-s1-5c9282fef8de3fd4c5a977000ec615f059c3609f37e76dafa78783846c40c1a8.mp3',
    },
    2: {
      audioUrl: '/audio/ch2/ch2-s2.mp3',
      wordsUrl: '/audio/ch2/ch2-s2.words.json',
      publishedUrl: 'https://atlas.foreviewusercontent.com/audio/atlas-ch2-s2-b26edd34902e370f3bf093c4e2c9f9ac71b5a28ae03636573527381b83813298.mp3',
    },
    3: {
      audioUrl: '/audio/ch2/ch2-s3.mp3',
      wordsUrl: '/audio/ch2/ch2-s3.words.json',
      publishedUrl: 'https://atlas.foreviewusercontent.com/audio/atlas-ch2-s3-a8d77e6afed08ed58b8251d593ea0bb424a0e45f4054493d86fb7c9a8d96fb0a.mp3',
    },
    4: {
      audioUrl: '/audio/ch2/ch2-s4.mp3',
      wordsUrl: '/audio/ch2/ch2-s4.words.json',
      publishedUrl: 'https://atlas.foreviewusercontent.com/audio/atlas-ch2-s4-4686a045837e279713d68d66630332584770122852590deadaf8a8ae85989146.mp3',
    },
    5: {
      audioUrl: '/audio/ch2/ch2-s5.mp3',
      wordsUrl: '/audio/ch2/ch2-s5.words.json',
      publishedUrl: 'https://atlas.foreviewusercontent.com/audio/atlas-ch2-s5-4be0e9acb75a9c59b16ece778cfa9c8a3026923cceb2be3260059a7239485d02.mp3',
    },
    6: {
      audioUrl: '/audio/ch2/ch2-s6.mp3',
      wordsUrl: '/audio/ch2/ch2-s6.words.json',
      publishedUrl: 'https://atlas.foreviewusercontent.com/audio/atlas-ch2-s6-3015ad6eb1fd8a1b4580c7597150bd8d95c983e21d4dfbe7d5183bd8f395db09.mp3',
    },
    7: {
      audioUrl: '/audio/ch2/ch2-s7.mp3',
      wordsUrl: '/audio/ch2/ch2-s7.words.json',
      publishedUrl: 'https://atlas.foreviewusercontent.com/audio/atlas-ch2-s7-e9c0fc7f7a142502efbac89b3a073398a026bb5457b236b900c53acd2d6592db.mp3',
    },
    8: {
      audioUrl: '/audio/ch2/ch2-s8.mp3',
      wordsUrl: '/audio/ch2/ch2-s8.words.json',
      publishedUrl: 'https://atlas.foreviewusercontent.com/audio/atlas-ch2-s8-803a6b6df6b4fc8e83f1a8b6ee57dfae046a96c96970f3dcf641fce045537af8.mp3',
    },
    9: {
      audioUrl: '/audio/ch2/ch2-s9.mp3',
      wordsUrl: '/audio/ch2/ch2-s9.words.json',
      publishedUrl: 'https://atlas.foreviewusercontent.com/audio/atlas-ch2-s9-158f21aa6bcbb8b1b24460625b70b330f25af57d48589e39a2a1d8b8e2b5604f.mp3',
    },
    10: {
      audioUrl: '/audio/ch2/ch2-s10.mp3',
      wordsUrl: '/audio/ch2/ch2-s10.words.json',
      publishedUrl: 'https://atlas.foreviewusercontent.com/audio/atlas-ch2-s10-89a2da2c36785e247359375c24600bfb324a735213fdb70eaf104e6eac895d70.mp3',
    },
  },
  3: {
    1: {
      audioUrl: '/audio/ch3/ch3-s1.mp3',
      wordsUrl: '/audio/ch3/ch3-s1.words.json',
      publishedUrl: 'https://atlas.foreviewusercontent.com/audio/atlas-ch3-s1-5054679abc188ea513c8add85c80944d69861f30edacf18edb600f6d96be4190.mp3',
    },
    2: {
      audioUrl: '/audio/ch3/ch3-s2.mp3',
      wordsUrl: '/audio/ch3/ch3-s2.words.json',
      publishedUrl: 'https://atlas.foreviewusercontent.com/audio/atlas-ch3-s2-f02bdcce65588c055d5ccd419d64624dcb1cc7f8c6dc6df19ccebf9fb8170128.mp3',
    },
    3: {
      audioUrl: '/audio/ch3/ch3-s3.mp3',
      wordsUrl: '/audio/ch3/ch3-s3.words.json',
      publishedUrl: 'https://atlas.foreviewusercontent.com/audio/atlas-ch3-s3-4d0e664fdb38c5e0dae842888f5cefbdc2586536dc43d1c184bf05d8f9cff2e8.mp3',
    },
    4: {
      audioUrl: '/audio/ch3/ch3-s4.mp3',
      wordsUrl: '/audio/ch3/ch3-s4.words.json',
      publishedUrl: 'https://atlas.foreviewusercontent.com/audio/atlas-ch3-s4-ae8dce55160e141a33aad66a2f095aae4942874c2bbabd2759262fdf2b4691db.mp3',
    },
    5: {
      audioUrl: '/audio/ch3/ch3-s5.mp3',
      wordsUrl: '/audio/ch3/ch3-s5.words.json',
      publishedUrl: 'https://atlas.foreviewusercontent.com/audio/atlas-ch3-s5-b691c822bf0633c1feed21773bb391af0355e256ca404581857c0e23129c8403.mp3',
    },
    6: {
      audioUrl: '/audio/ch3/ch3-s6.mp3',
      wordsUrl: '/audio/ch3/ch3-s6.words.json',
      publishedUrl: 'https://atlas.foreviewusercontent.com/audio/atlas-ch3-s6-c218d8deff154240d33b09b01e97bf366c513bc49ec8b1a4f80ecdaa0ec7bc22.mp3',
    },
    7: {
      audioUrl: '/audio/ch3/ch3-s7.mp3',
      wordsUrl: '/audio/ch3/ch3-s7.words.json',
      publishedUrl: 'https://atlas.foreviewusercontent.com/audio/atlas-ch3-s7-d2d46115abff02ef68bb5eac646bd6ce31706c099debf76c3633b9b18f2f1e2d.mp3',
    },
    8: {
      audioUrl: '/audio/ch3/ch3-s8.mp3',
      wordsUrl: '/audio/ch3/ch3-s8.words.json',
      publishedUrl: 'https://atlas.foreviewusercontent.com/audio/atlas-ch3-s8-b71f987390d16e25cb3d2a19f4b01703fdd9fb4f6b3662c1d6ad7f6b5f949038.mp3',
    },
    9: {
      audioUrl: '/audio/ch3/ch3-s9.mp3',
      wordsUrl: '/audio/ch3/ch3-s9.words.json',
      publishedUrl: 'https://atlas.foreviewusercontent.com/audio/atlas-ch3-s9-35a8c5faf1cf3ae3bf60633c9e113b9d9a1d6693c9bf1637afcdca385c0b3dad.mp3',
    },
    10: {
      audioUrl: '/audio/ch3/ch3-s10.mp3',
      wordsUrl: '/audio/ch3/ch3-s10.words.json',
      publishedUrl: 'https://atlas.foreviewusercontent.com/audio/atlas-ch3-s10-6dc6317a684ab921c479aedf5cee7b4b558fd20393ea0309a1149dd4c4381d53.mp3',
    },
  },
  4: {
    1: {
      audioUrl: '/audio/ch4/ch4-s1.mp3',
      wordsUrl: '/audio/ch4/ch4-s1.words.json',
      publishedUrl: 'https://atlas.foreviewusercontent.com/audio/atlas-ch4-s1-ec7a7293ee7e911a5d063e8dc666b90a6c46d3204f9594b3de854db71609164d.mp3',
    },
    2: {
      audioUrl: '/audio/ch4/ch4-s2.mp3',
      wordsUrl: '/audio/ch4/ch4-s2.words.json',
      publishedUrl: 'https://atlas.foreviewusercontent.com/audio/atlas-ch4-s2-fdf3f7afa98e48b5bd5d64c54186ab6e79dcfc58ffa218807a71aaec6a39af6c.mp3',
    },
    3: {
      audioUrl: '/audio/ch4/ch4-s3.mp3',
      wordsUrl: '/audio/ch4/ch4-s3.words.json',
      publishedUrl: 'https://atlas.foreviewusercontent.com/audio/atlas-ch4-s3-94cbd4ba8fb45f4dae7da41e36f10bc080994c0949dc4b9d4b2202faea9ca1fe.mp3',
    },
    4: {
      audioUrl: '/audio/ch4/ch4-s4.mp3',
      wordsUrl: '/audio/ch4/ch4-s4.words.json',
      publishedUrl: 'https://atlas.foreviewusercontent.com/audio/atlas-ch4-s4-31d32e6bf62c1844fec667198d3cdf4ebbaef4923be741f8d9bbb27cd0c544a2.mp3',
    },
    5: {
      audioUrl: '/audio/ch4/ch4-s5.mp3',
      wordsUrl: '/audio/ch4/ch4-s5.words.json',
      publishedUrl: 'https://atlas.foreviewusercontent.com/audio/atlas-ch4-s5-906d74c1523a40c5b18e8bb16c4a9e2871d2a1129ff30a7094274f855e70d7b1.mp3',
    },
    6: {
      audioUrl: '/audio/ch4/ch4-s6.mp3',
      wordsUrl: '/audio/ch4/ch4-s6.words.json',
      publishedUrl: 'https://atlas.foreviewusercontent.com/audio/atlas-ch4-s6-aae267373d5dbc3a2fdb71e8cc4d16fb91d18bd6fbc849861bd3ccdd99a5e53b.mp3',
    },
    7: {
      audioUrl: '/audio/ch4/ch4-s7.mp3',
      wordsUrl: '/audio/ch4/ch4-s7.words.json',
      publishedUrl: 'https://atlas.foreviewusercontent.com/audio/atlas-ch4-s7-bfbbd4026aa9f112a16fff2c3eae27767133de03091b873b677f9b097f28618f.mp3',
    },
    8: {
      audioUrl: '/audio/ch4/ch4-s8.mp3',
      wordsUrl: '/audio/ch4/ch4-s8.words.json',
      publishedUrl: 'https://atlas.foreviewusercontent.com/audio/atlas-ch4-s8-ddb124285813a54faa9a61a02163b5754c1cc7810a0aaeebeab01bc0ac41e3a2.mp3',
    },
    9: {
      audioUrl: '/audio/ch4/ch4-s9.mp3',
      wordsUrl: '/audio/ch4/ch4-s9.words.json',
      publishedUrl: 'https://atlas.foreviewusercontent.com/audio/atlas-ch4-s9-9e8958c10ecebec7580a66ce243e9c51c153688fdf986f6dcabf764af0d07a45.mp3',
    },
  },
  5: {
    1: {
      audioUrl: '/audio/ch5/ch5-s1.mp3',
      wordsUrl: '/audio/ch5/ch5-s1.words.json',
      publishedUrl: 'https://atlas.foreviewusercontent.com/audio/atlas-ch5-s1-668d14d35baf9f804b29bdbb90bbdbd6e260cedb0f8b3784f92bf591b4b6e7f8.mp3',
    },
    2: {
      audioUrl: '/audio/ch5/ch5-s2.mp3',
      wordsUrl: '/audio/ch5/ch5-s2.words.json',
      publishedUrl: 'https://atlas.foreviewusercontent.com/audio/atlas-ch5-s2-e4aa31c44868aaa522329eb1a98b0a0d4ccb043576492fe8856cee987d0969d0.mp3',
    },
    3: {
      audioUrl: '/audio/ch5/ch5-s3.mp3',
      wordsUrl: '/audio/ch5/ch5-s3.words.json',
      publishedUrl: 'https://atlas.foreviewusercontent.com/audio/atlas-ch5-s3-bc57b3a1207c25dad03d63e8aacba816fb144590557833ed6d0b234d50f87e7c.mp3',
    },
    4: {
      audioUrl: '/audio/ch5/ch5-s4.mp3',
      wordsUrl: '/audio/ch5/ch5-s4.words.json',
      publishedUrl: 'https://atlas.foreviewusercontent.com/audio/atlas-ch5-s4-6bb5de1c1301a7451e9df63fd0ffd6597b1bdf9d1ee6dc3e62ba5aab12fd9c4c.mp3',
    },
    5: {
      audioUrl: '/audio/ch5/ch5-s5.mp3',
      wordsUrl: '/audio/ch5/ch5-s5.words.json',
      publishedUrl: 'https://atlas.foreviewusercontent.com/audio/atlas-ch5-s5-5f62f04930f4162c75f88f5b02281d1c6d9c291b8dc2dbaa2d832154fb2acb22.mp3',
    },
    6: {
      audioUrl: '/audio/ch5/ch5-s6.mp3',
      wordsUrl: '/audio/ch5/ch5-s6.words.json',
      publishedUrl: 'https://atlas.foreviewusercontent.com/audio/atlas-ch5-s6-c9adaa7c10ce0f6880fb97fea25ed9678b978ab1beac9d1fac44eebadb40d824.mp3',
    },
    7: {
      audioUrl: '/audio/ch5/ch5-s7.mp3',
      wordsUrl: '/audio/ch5/ch5-s7.words.json',
      publishedUrl: 'https://atlas.foreviewusercontent.com/audio/atlas-ch5-s7-32f67bc94ac60d440d63f5c990b7c267a30cbe6a60224f588099db7c80f8f977.mp3',
    },
    8: {
      audioUrl: '/audio/ch5/ch5-s8.mp3',
      wordsUrl: '/audio/ch5/ch5-s8.words.json',
      publishedUrl: 'https://atlas.foreviewusercontent.com/audio/atlas-ch5-s8-a4e9a4eba37e7c51a1f8ee3df01e9f634420620b679814a2b381afefd4fb4311.mp3',
    },
    9: {
      audioUrl: '/audio/ch5/ch5-s9.mp3',
      wordsUrl: '/audio/ch5/ch5-s9.words.json',
      publishedUrl: 'https://atlas.foreviewusercontent.com/audio/atlas-ch5-s9-6fa844cc580cd77e6b70a736216e5c62f9cedc2002a449e998b06e2512758082.mp3',
    },
    10: {
      audioUrl: '/audio/ch5/ch5-s10.mp3',
      wordsUrl: '/audio/ch5/ch5-s10.words.json',
      publishedUrl: 'https://atlas.foreviewusercontent.com/audio/atlas-ch5-s10-f9048c57d66f057ad7f7fefbffb2733b77293c95b6d82bed3f7798eb8ff665ef.mp3',
    },
    11: {
      audioUrl: '/audio/ch5/ch5-s11.mp3',
      wordsUrl: '/audio/ch5/ch5-s11.words.json',
      publishedUrl: 'https://atlas.foreviewusercontent.com/audio/atlas-ch5-s11-a92e7cc77a258406c11d99d5abbdbdfaebc635b9c3d05e783b26857575df7014.mp3',
    },
  },
  6: {
    1: {
      audioUrl: '/audio/ch6/ch6-s1.mp3',
      wordsUrl: '/audio/ch6/ch6-s1.words.json',
      publishedUrl: 'https://atlas.foreviewusercontent.com/audio/atlas-ch6-s1-9b32367139ffec93132e4c7d5d6aa83c782d4966731dc69cc3b006a1eeb9cb1a.mp3',
    },
    2: {
      audioUrl: '/audio/ch6/ch6-s2.mp3',
      wordsUrl: '/audio/ch6/ch6-s2.words.json',
      publishedUrl: 'https://atlas.foreviewusercontent.com/audio/atlas-ch6-s2-b81872c402727be6434df34e8088d546281bad58d67fafc854005ebe5090c3ca.mp3',
    },
    3: {
      audioUrl: '/audio/ch6/ch6-s3.mp3',
      wordsUrl: '/audio/ch6/ch6-s3.words.json',
      publishedUrl: 'https://atlas.foreviewusercontent.com/audio/atlas-ch6-s3-df003cb6666ccde06ae360ae9872bec0099d6da0987b09f406c18876dbd13cc1.mp3',
    },
    4: {
      audioUrl: '/audio/ch6/ch6-s4.mp3',
      wordsUrl: '/audio/ch6/ch6-s4.words.json',
      publishedUrl: 'https://atlas.foreviewusercontent.com/audio/atlas-ch6-s4-0091a779eb8aa4fbade577935a43247ef3bcc3219690a2f3fb19605c4e26e927.mp3',
    },
    5: {
      audioUrl: '/audio/ch6/ch6-s5.mp3',
      wordsUrl: '/audio/ch6/ch6-s5.words.json',
      publishedUrl: 'https://atlas.foreviewusercontent.com/audio/atlas-ch6-s5-e5197e470fb39ece4d0cb8a44d496ddb8798f0f03f62a9fc0295e1bc6645a65f.mp3',
    },
    6: {
      audioUrl: '/audio/ch6/ch6-s6.mp3',
      wordsUrl: '/audio/ch6/ch6-s6.words.json',
      publishedUrl: 'https://atlas.foreviewusercontent.com/audio/atlas-ch6-s6-5f92cee0e2b9a76210dc38874381996c3749302fafe15f49c1ab04d84dfbdca9.mp3',
    },
  },
  7: {
    1: {
      audioUrl: '/audio/ch7/ch7-s1.mp3',
      wordsUrl: '/audio/ch7/ch7-s1.words.json',
      publishedUrl: 'https://atlas.foreviewusercontent.com/audio/atlas-ch7-s1-dc3f6f1e72014ac01d5bfe2bb10b58bfb0619cec9c2692b4aa44672e9c092eb0.mp3',
    },
    2: {
      audioUrl: '/audio/ch7/ch7-s2.mp3',
      wordsUrl: '/audio/ch7/ch7-s2.words.json',
      publishedUrl: 'https://atlas.foreviewusercontent.com/audio/atlas-ch7-s2-a80e57f252ff7f91188e7dd093b52e3db7c861da16d0d8164f253dabbf131a70.mp3',
    },
    3: {
      audioUrl: '/audio/ch7/ch7-s3.mp3',
      wordsUrl: '/audio/ch7/ch7-s3.words.json',
      publishedUrl: 'https://atlas.foreviewusercontent.com/audio/atlas-ch7-s3-18f8e4af1d9c658ff89b2c9e0cdb03a393f96474670c6cec71cd53f61c3ba55b.mp3',
    },
    4: {
      audioUrl: '/audio/ch7/ch7-s4.mp3',
      wordsUrl: '/audio/ch7/ch7-s4.words.json',
      publishedUrl: 'https://atlas.foreviewusercontent.com/audio/atlas-ch7-s4-a11f4e91c9a8f7c994fe513fcca03e77e7da7dcf9aa55a782051fadd11b72ec4.mp3',
    },
    5: {
      audioUrl: '/audio/ch7/ch7-s5.mp3',
      wordsUrl: '/audio/ch7/ch7-s5.words.json',
      publishedUrl: 'https://atlas.foreviewusercontent.com/audio/atlas-ch7-s5-51c3f4a445d575dafca78a80e37237f23348b6a8536755b22a56e13550ca7f8a.mp3',
    },
    6: {
      audioUrl: '/audio/ch7/ch7-s6.mp3',
      wordsUrl: '/audio/ch7/ch7-s6.words.json',
      publishedUrl: 'https://atlas.foreviewusercontent.com/audio/atlas-ch7-s6-8f2a15ba0ea8aa5cb3332768e35fcfcdaf1dbf277dc1be9703046235a682f11f.mp3',
    },
    7: {
      audioUrl: '/audio/ch7/ch7-s7.mp3',
      wordsUrl: '/audio/ch7/ch7-s7.words.json',
      publishedUrl: 'https://atlas.foreviewusercontent.com/audio/atlas-ch7-s7-7c4dda56aa4cda635744854135841db73338d08f1975dc16e5b3187298a35050.mp3',
    },
  },
  8: {
    1: {
      audioUrl: '/audio/ch8/ch8-s1.mp3',
      wordsUrl: '/audio/ch8/ch8-s1.words.json',
      publishedUrl: 'https://atlas.foreviewusercontent.com/audio/atlas-ch8-s1-b3996fbf6eeefea02e30bc01946404f378227a04913402053db876c8b5129a9a.mp3',
    },
    2: {
      audioUrl: '/audio/ch8/ch8-s2.mp3',
      wordsUrl: '/audio/ch8/ch8-s2.words.json',
      publishedUrl: 'https://atlas.foreviewusercontent.com/audio/atlas-ch8-s2-53755b99a8fca171599dbd0ee9b24c6afa7f53f28816c9a9577284379667eb50.mp3',
    },
    3: {
      audioUrl: '/audio/ch8/ch8-s3.mp3',
      wordsUrl: '/audio/ch8/ch8-s3.words.json',
      publishedUrl: 'https://atlas.foreviewusercontent.com/audio/atlas-ch8-s3-398c3ad9974a80ab86d22bd0d55fd8a138470f00737d9240413abf3edb385bac.mp3',
    },
    4: {
      audioUrl: '/audio/ch8/ch8-s4.mp3',
      wordsUrl: '/audio/ch8/ch8-s4.words.json',
      publishedUrl: 'https://atlas.foreviewusercontent.com/audio/atlas-ch8-s4-ebbf1f23cab5a9a4895ce66180357ba04f5dfef5bdefb5ccf82a17066eccc898.mp3',
    },
    5: {
      audioUrl: '/audio/ch8/ch8-s5.mp3',
      wordsUrl: '/audio/ch8/ch8-s5.words.json',
      publishedUrl: 'https://atlas.foreviewusercontent.com/audio/atlas-ch8-s5-46cef9a091328ff9f503fc3771013da3d32a08b0891c4b9450f88b4eb99b7ae7.mp3',
    },
    6: {
      audioUrl: '/audio/ch8/ch8-s6.mp3',
      wordsUrl: '/audio/ch8/ch8-s6.words.json',
      publishedUrl: 'https://atlas.foreviewusercontent.com/audio/atlas-ch8-s6-e53c27fe5bb51ca8e4e5d223446dd58858ef0d3812da69d61dca94939cedde33.mp3',
    },
    7: {
      audioUrl: '/audio/ch8/ch8-s7.mp3',
      wordsUrl: '/audio/ch8/ch8-s7.words.json',
      publishedUrl: 'https://atlas.foreviewusercontent.com/audio/atlas-ch8-s7-3734e4e0bb432397939f60a46fd9f9eb84c2deef1106fae7cd036af032e7ccfd.mp3',
    },
  },
}

export default chapterTimings
