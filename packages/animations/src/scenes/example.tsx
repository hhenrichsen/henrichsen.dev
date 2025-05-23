import { Circle, makeScene2D } from "@motion-canvas/2d";
import { Color, createRef, useScene } from "@motion-canvas/core";
import { getColors } from "../util/colors";

export default makeScene2D(function* (view) {
  // Create your animations here

  const circle = createRef<Circle>();
  const colors = getColors();

  view.add(<Circle ref={circle} size={320} fill={colors["--yellow"]} />);

  yield* circle().scale(2, 2).to(1, 2);
});
