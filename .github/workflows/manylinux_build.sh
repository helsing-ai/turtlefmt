cd /workdir
dnf install -y dnf-plugins-core
dnf module install -y nodejs:20 llvm-toolset:rhel8
curl https://static.rust-lang.org/rustup/dist/$(uname -m)-unknown-linux-gnu/rustup-init --output rustup-init
chmod +x rustup-init
./rustup-init -y --profile minimal
source "$HOME/.cargo/env"
python3.12 -m venv venv
source venv/bin/activate
pip install maturin
maturin build --release --compatibility manylinux_2_28
