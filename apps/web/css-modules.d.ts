declare module "*.module.css" {
  const classes: Record<string, string> & {
    // This allows direct property access without undefined
    [key: string]: string;
  };
  export default classes;
}

// Override the noUncheckedIndexedAccess for CSS modules
declare global {
  interface CSSModuleClasses {
    [className: string]: string;
  }
}
