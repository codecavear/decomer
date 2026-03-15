export default defineAppConfig({
  ui: {
    colors: {
      primary: 'green',
      neutral: 'slate'
    },
    input: {
      slots: {
        root: 'w-full relative inline-flex items-center'
      }
    },
    select: {
      slots: {
        base: 'w-full'
      }
    },
    textarea: {
      slots: {
        root: 'w-full relative inline-flex items-center'
      }
    },
    selectMenu: {
      slots: {
        base: 'w-full'
      }
    }
  }
})
