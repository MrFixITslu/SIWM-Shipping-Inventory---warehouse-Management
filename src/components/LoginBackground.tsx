import React from 'react';

/**
 * Renders a set of decorative, animated shapes for the background of the login page.
 * The shapes and animations are defined in index.css.
 */
const LoginBackground: React.FC = () => {
  return (
    <>
      <div className="animated-bg-shape shape-1" />
      <div className="animated-bg-shape shape-2" />
      <div className="animated-bg-shape shape-3" />
    </>
  );
};

export default LoginBackground;
