use biblatex::Bibliography;
fn main() {
    let src = "@book{test, title={A Book}, author={Smith, John and Doe, Jane}, publisher={Press}, isbn={12345}, edition={2nd}}";
    let bib = Bibliography::parse(src).unwrap();
    let entry = bib.iter().next().unwrap();
    println!("Title: {}", entry.title().unwrap().format_verbatim());
    // publisher?
    // let publ = entry.publisher();
    // println!("Publisher: {:?}", publ);
}
