{
  inputs = {
    flake-utils.url = "github:numtide/flake-utils";
    fedimint = {
      url = "github:fedimint/fedimint?ref=v0.6.1";
    };
  };
  outputs =
    {
      self,
      flake-utils,
      fedimint,
    }:
    flake-utils.lib.eachDefaultSystem (
      system:
      let
        nixpkgs = fedimint.inputs.nixpkgs;
        pkgs = import nixpkgs {
          inherit system;
          overlays = [fedimint.overlays.all];
        };
      in
      {
        devShells = {
          default = pkgs.mkShell {
            nativeBuildInputs = [
              fedimint.packages.${system}.devimint
              fedimint.packages.${system}.gateway-pkgs
              fedimint.packages.${system}.fedimint-pkgs
              pkgs.bitcoind
              pkgs.electrs
              pkgs.jq
              pkgs.lnd
              pkgs.netcat
              pkgs.perl
              pkgs.esplora-electrs
              pkgs.procps
              pkgs.which
              pkgs.git
              pkgs.clightning

              pkgs.pnpm
              pkgs.nodejs_20
              # The version of playwright in nixpkgs has to match the version specified in package.json
              pkgs.playwright-driver.browsers
            ];

            shellHook = ''
              export PLAYWRIGHT_BROWSERS_PATH=${pkgs.playwright-driver.browsers}
              export PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS=true
            '';
          };
        };
      }
    );
  nixConfig = {
    extra-substituters = [ "https://fedimint.cachix.org" ];
    extra-trusted-public-keys = [
      "fedimint.cachix.org-1:FpJJjy1iPVlvyv4OMiN5y9+/arFLPcnZhZVVCHCDYTs="
    ];
  };
}
