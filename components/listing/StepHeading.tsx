import React from "react";

type StepHeadingProps = {
  heading: string;
  description: string;
};

export function StepHeading({ heading, description }: StepHeadingProps) {
  return (
    <header className="mb-8">
      <h1 className="text-[28px] font-semibold leading-tight tracking-tight text-ink md:text-[32px]">
        {heading}
      </h1>
      <p className="mt-2 text-lg text-muted">{description}</p>
    </header>
  );
}
