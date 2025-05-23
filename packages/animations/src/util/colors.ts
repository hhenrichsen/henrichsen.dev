import { Colors } from "@hhenrichsen/canvas-commons";
import { Color, SignalValue, useScene } from "@motion-canvas/core";

const defaultColors: Record<string, string> = {
  "--text": Colors.Catppuccin.Mocha.Text,
  "--subtext": Colors.Catppuccin.Mocha.Subtext0,
  "--surface": Colors.Catppuccin.Mocha.Surface0,
  "--crust": Colors.Catppuccin.Mocha.Crust,
  "--mantle": Colors.Catppuccin.Mocha.Mantle,
  "--red": Colors.Catppuccin.Mocha.Red,
  "--peach": Colors.Catppuccin.Mocha.Peach,
  "--yellow": Colors.Catppuccin.Mocha.Yellow,
  "--green": Colors.Catppuccin.Mocha.Green,
  "--blue": Colors.Catppuccin.Mocha.Blue,
  "--sky": Colors.Catppuccin.Mocha.Sky,
};

export function getColors(): Record<
  keyof typeof defaultColors,
  SignalValue<Color>
> {
  return Object.fromEntries(
    Object.entries(defaultColors).map(([key, value]) => {
      return [key, () => new Color(useScene().variables.get(key, value)())];
    })
  );
}
