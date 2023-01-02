cd /workdir
yum -y install centos-release-scl-rh
yum -y install llvm-toolset-7.0 rh-nodejs12
source scl_source enable llvm-toolset-7.0
source scl_source enable rh-nodejs12
curl https://deu01.safelinks.protection.outlook.com/?url=https%3A%2F%2Fstatic.rust-lang.org%2Frustup%2Fdist%2Fx86_64-unknown-linux-gnu%2Frustup-init&data=05%7C01%7C%7C3e06f52d7c504775ae4e08daecdf70bb%7Cf3566adeb0fc444dbf20cb164c119c6f%7C0%7C0%7C638082742821692413%7CUnknown%7CTWFpbGZsb3d8eyJWIjoiMC4wLjAwMDAiLCJQIjoiV2luMzIiLCJBTiI6Ik1haWwiLCJXVCI6Mn0%3D%7C3000%7C%7C%7C&sdata=jUnQytvDpqO1JeEfUoeuRqycuHiFR5eA%2BZ4Abss2U%2BM%3D&reserved=0
--output rustup-init
chmod +x rustup-init
./rustup-init -y --profile minimal
source "$HOME/.cargo/env"
export PATH="${PATH}:/opt/python/cp37-cp37m/bin:/opt/python/cp38-cp38/bin:/opt/python/cp39-cp39/bin:/opt/python/cp310-cp310/bin:/opt/python/cp311-cp311/bin"
python3.11 -m venv venv
source venv/bin/activate
pip install maturin
maturin build --release --compatibility manylinux2014
