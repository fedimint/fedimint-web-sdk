{
  inputs = {
    flake-utils.url = "github:numtide/flake-utils";
    fedimint = {
      url =
        "github:fedimint/fedimint?rev=920bba47df761e026e7fe8fb2df398e14f663727";
    };
  };
  outputs = { self, flake-utils, fedimint }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        nixpkgs = fedimint.inputs.nixpkgs;
        pkgs = import nixpkgs {
          inherit system;
          overlays = fedimint.overlays.fedimint;
        };
        fmLib = fedimint.lib.${system};
      in
      {
        devShells = fmLib.devShells // {
          default = fmLib.devShells.default.overrideAttrs (prev: {
            nativeBuildInputs = [
              fedimint.packages.${system}.devimint
              fedimint.packages.${system}.gateway-pkgs
              fedimint.packages.${system}.fedimint-pkgs
            ] ++ prev.nativeBuildInputs;
          });
        };
      });
  nixConfig = {
    extra-substituters = [ "https://fedimint.cachix.org" ];
    extra-trusted-public-keys = [ "fedimint.cachix.org-1:FpJJjy1iPVlvyv4OMiN5y9+/arFLPcnZhZVVCHCDYTs=" ];
  };
}
