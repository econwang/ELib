use biblatex::Bibliography;
fn main() {
    let src = "@book{test, title={A Book}, author={Mariano, Roberto S. and Schuermann, Til and Weeks, Melvyn}, publisher={Press}, isbn={12345}, edition={2nd}}";
    let bib = Bibliography::parse(src).unwrap();
    let entry = bib.iter().next().unwrap();
    let author_raw = entry.get("author").map(|c| c.format_verbatim()).unwrap_or_default();
    println!("Raw Author: {}", author_raw);
}
