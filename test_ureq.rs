fn main() {
    let url = "http://example.com";
    let response = ureq::get(url).call().unwrap();
    let bytes = response.into_body().read_to_vec().unwrap();
    println!("bytes length: {}", bytes.len());
}
