To release a new version:

1. Create the branch on GitHub.
2. Release on Crates.io: `cargo publish`
3. Release on Pypi.
   1. From macOS: `maturin publish --universal2`
   2. For Linux: `docker run -v "$(pwd)":/workdir quay.io/pypa/manylinux2014_x86_64 /bin/bash /workdir/build_manylinux_wheel.sh` then `twine upload target/wheels/*`
