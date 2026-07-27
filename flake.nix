{
  description = "MyCode - Cross-Platform Code Editor development environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
      in
      {
        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [
            # Node.js and npm
            nodejs_22
            
            # For native node modules if needed
            python3
            gnumake
            gcc
            
            # Electron dependencies on Linux
            xorg.libX11
            xorg.libXcursor
            xorg.libXrandr
            xorg.libXi
            xorg.libXScrnSaver
            xorg.libXcomposite
            xorg.libXdamage
            xorg.libXext
            xorg.libXfixes
            xorg.libXrender
            xorg.libXtst
            libxkbcommon
            atk
            at-spi2-atk
            at-spi2-core
            cups
            dbus
            expat
            gdk-pixbuf
            glib
            gtk3
            nspr
            nss
            pango
            cairo
            mesa
            alsa-lib
            libdrm
          ];

          shellHook = ''
            echo ""
            echo "🚀 MyCode Development Environment"
            echo "=================================="
            echo "Node.js: $(node --version)"
            echo "npm: $(npm --version)"
            echo ""
            echo "Commands:"
            echo "  npm install    - Install dependencies"
            echo "  npm run dev    - Start development mode"
            echo "  npm run build  - Build for production"
            echo "  npm start      - Run the app"
            echo ""
            
            # Set npm to use local node_modules binaries
            export PATH="$PWD/node_modules/.bin:$PATH"
            
            # Electron needs this for GPU rendering
            export ELECTRON_OZONE_PLATFORM_HINT=auto
          '';
        };
      }
    );
}
