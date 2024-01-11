cd /workdir
apk add clang-dev nodejs
curl https://static.rust-lang.org/rustup/dist/$(uname -m)-unknown-linux-musl/rustup-init --output rustup-init
chmod +x rustup-init
./rustup-init -y --profile minimal
source "$HOME/.cargo/env"
python3.12 -m venv venv
source venv/bin/activate
pip install maturin
maturin build --release --compatibility musllinux_1_2
