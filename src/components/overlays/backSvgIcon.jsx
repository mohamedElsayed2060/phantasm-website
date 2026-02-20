const BackSvgIcon = () => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="10" viewBox="0 0 12 10" fill="none">
      <g filter="url(#filter0_d_65_7574)">
        <path
          d="M3 3L3 2L4 2L4 1L5 1L5 2.43986e-06L7 2.70213e-06L7 1L12 1L12 9L7 9L7 10L5 10L5 9L4 9L4 8L3 8L3 7L2 7L2 6L1 6L1 4L2 4L2 3L3 3Z"
          fill="white"
        />
      </g>
      <defs>
        <filter
          id="filter0_d_65_7574"
          x="0"
          y="1.91532e-06"
          width="12"
          height="10"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset dx="-1" />
          <feComposite in2="hardAlpha" operator="out" />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0.753456 0 0 0 0 0.578534 0 0 0 0 0.578534 0 0 0 1 0"
          />
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_65_7574" />
          <feBlend
            mode="normal"
            in="SourceGraphic"
            in2="effect1_dropShadow_65_7574"
            result="shape"
          />
        </filter>
      </defs>
    </svg>
  )
}
export default BackSvgIcon
