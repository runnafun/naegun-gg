import MatchSearchInput from
  "./MatchSearchInput";


export default function MatchSearchHero() {
  return (
    <section className="matches-hero">

      <div className="matches-hero-overlay" />


      <div className="matches-hero-content">

        <h1 className="matches-title">
          찾으시는 내전 코드를 입력해주세요
        </h1>


        <p className="matches-description">
          내전.GG에서 진행 중인 내전을 조회할 수 있습니다
        </p>


        <div className="matches-search">

          <MatchSearchInput
            variant="hero"
          />

        </div>

      </div>

    </section>
  );
}