cd /workdir
yum -y install centos-release-scl-rh
yum -y install llvm-toolset-7.0 rh-nodejs12
source scl_source enable llvm-toolset-7.0
source scl_source enable rh-nodejs12
curl https://static.rust-lang.org/rustup/dist/$(uname -m)-unknown-linux-gnu/rustup-init --output rustup-init
chmod +x rustup-init
./rustup-init -y --profile minimal
source "$HOME/.cargo/env"
export PATH="${PATH}:/opt/python/cp37-cp37m/bin:/opt/python/cp38-cp38/bin:/opt/python/cp39-cp39/bin:/opt/python/cp310-cp310/bin:/opt/python/cp311-cp311/bin"
python3.11 -m venv venv
source venv/bin/activate
pip install maturin
maturin build --release --compatibility manylinux2014
