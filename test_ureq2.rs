fn main() {
    let url = "http://example.com";
    let response = ureq::get(url).call().unwrap();
    let mut bytes = Vec::new();
    std::io::Read::read_to_end(&mut response.into_body().into_reader(), &mut bytes).unwrap();
    println!("bytes length: {}", bytes.len());
}
