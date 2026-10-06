"use client";

import {
  useState,
} from "react";

import type {
  MatchHistoryItem,
  MatchTeamPlayer,
} from "../../../data/profile";


type Props = {
  matches:
    MatchHistoryItem[];
};


type DetailTab =
  | "summary"
  | "score"
  | "team"
  | "build"
  | "etc";


function PlayerMiniList({
  players,
}: {
  players:
    MatchHistoryItem["allies"];
}) {
  return (
    <div className="match-mini-player-list">

      {players.map(
        (player) => (
          <div
            key={
              player.name
            }
            className={
              `match-mini-player ${
                player.isMe
                  ? "is-me"
                  : ""
              }`
            }
          >

            <div className="match-mini-champion-image">
              <img
                src={
                  player.championImage
                }
                alt=""
              />
            </div>

            <span>
              {
                player.name
              }
            </span>

          </div>
        )
      )}

    </div>
  );
}


function DetailTeamRow({
  player,
}: {
  player:
    MatchTeamPlayer;
}) {
  return (
    <div className="match-detail-player-row">

      <div className="match-detail-user">

        <div className="match-detail-champion-image">
          <img
            src={
              player.championImage
            }
            alt=""
          />
        </div>


        <div className="match-detail-user-text">

          <strong>
            {
              player.name
            }
          </strong>

          <span>
            Lv.
            {
              player.level
            }
          </span>

        </div>

      </div>


      <div className="match-detail-score">

        <strong>
          {
            player.opScore
          }
        </strong>

        {player.badge && (
          <span>
            {
              player.badge
            }
          </span>
        )}

      </div>


      <div className="match-detail-kda">

        <strong>
          {
            player.kills
          }
          /
          {
            player.deaths
          }
          /
          {
            player.assists
          }
        </strong>

        <span>
          {(
            (
              player.kills +
              player.assists
            ) /
            Math.max(
              player.deaths,
              1
            )
          ).toFixed(2)}
          :1
        </span>

      </div>


      <div className="match-detail-number">
        {
          player.damage.toLocaleString()
        }
      </div>


      <div className="match-detail-number">
        {
          player.wards
        }
      </div>


      <div className="match-detail-number">
        {
          player.cs
        }
      </div>


      <div className="match-detail-items">

        {player.items.map(
          (image, index) => (
            <img
              key={index}
              src={image}
              alt=""
            />
          )
        )}

      </div>

    </div>
  );
}


function MatchDetail({
  match,
}: {
  match:
    MatchHistoryItem;
}) {
  const [
    tab,
    setTab,
  ] = useState<DetailTab>(
    "summary"
  );


  return (
    <div className="match-detail-panel">

      <div className="match-detail-tabs">

        <button
          type="button"
          className={
            tab === "summary"
              ? "active"
              : ""
          }
          onClick={() =>
            setTab("summary")
          }
        >
          종합
        </button>


        <button
          type="button"
          className={
            tab === "score"
              ? "active"
              : ""
          }
          onClick={() =>
            setTab("score")
          }
        >
          OP 스코어
        </button>


        <button
          type="button"
          className={
            tab === "team"
              ? "active"
              : ""
          }
          onClick={() =>
            setTab("team")
          }
        >
          팀 분석
        </button>


        <button
          type="button"
          className={
            tab === "build"
              ? "active"
              : ""
          }
          onClick={() =>
            setTab("build")
          }
        >
          빌드
        </button>


        <button
          type="button"
          className={
            tab === "etc"
              ? "active"
              : ""
          }
          onClick={() =>
            setTab("etc")
          }
        >
          기타
        </button>

      </div>


      {tab === "summary" && (
        <div className="match-detail-summary">

          <div className="match-detail-header-row">

            <span>
              소환사
            </span>

            <span>
              OP Score
            </span>

            <span>
              KDA
            </span>

            <span>
              피해량
            </span>

            <span>
              와드
            </span>

            <span>
              CS
            </span>

            <span>
              아이템
            </span>

          </div>


          <div className="match-detail-team-heading blue">

            <strong>
              승리
            </strong>

            <div>
              <span>
                총 킬
              </span>

              <b>
                {
                  match.detail.blueKills
                }
              </b>
            </div>

            <div>
              <span>
                총 골드
              </span>

              <b>
                {
                  match.detail.blueGold.toLocaleString()
                }
              </b>
            </div>

          </div>


          {match.detail.blueTeam.map(
            (player) => (
              <DetailTeamRow
                key={
                  player.name
                }
                player={
                  player
                }
              />
            )
          )}


          <div className="match-detail-team-heading red">

            <strong>
              패배
            </strong>

            <div>
              <span>
                총 킬
              </span>

              <b>
                {
                  match.detail.redKills
                }
              </b>
            </div>

            <div>
              <span>
                총 골드
              </span>

              <b>
                {
                  match.detail.redGold.toLocaleString()
                }
              </b>
            </div>

          </div>


          {match.detail.redTeam.map(
            (player) => (
              <DetailTeamRow
                key={
                  player.name
                }
                player={
                  player
                }
              />
            )
          )}

        </div>
      )}


      {tab !== "summary" && (
        <div className="match-detail-placeholder">
          해당 탭 상세 데이터 영역
        </div>
      )}

    </div>
  );
}


function MatchCard({
  match,
  defaultOpen,
}: {
  match:
    MatchHistoryItem;

  defaultOpen:
    boolean;
}) {
  const [
    open,
    setOpen,
  ] = useState(
    defaultOpen
  );


  return (
    <article
      className={
        `profile-match-wrap ${
          match.result === "win"
            ? "is-win"
            : "is-lose"
        }`
      }
    >

      <div className="profile-match-card">


        <div className="profile-match-result">

          <strong>
            {
              match.queue
            }
          </strong>

          <span>
            {
              match.ago
            }
          </span>

          <b>
            {
              match.result ===
              "win"
                ? "승리"
                : "패배"
            }
          </b>

          <span>
            {
              match.duration
            }
          </span>

        </div>


        <div className="profile-match-champion-area">

          <div className="profile-match-champion">

            <div className="profile-match-champion-image">
              <img
                src={
                  match.championImage
                }
                alt={
                  match.champion
                }
              />
            </div>

            <span>
              {
                match.championLevel
              }
            </span>

          </div>


          <div className="profile-match-spells">

            {match.spells.map(
              (image) => (
                <img
                  key={image}
                  src={image}
                  alt=""
                />
              )
            )}

          </div>


          <div className="profile-match-runes">

            {match.runes.map(
              (image) => (
                <img
                  key={image}
                  src={image}
                  alt=""
                />
              )
            )}

          </div>

        </div>


        <div className="profile-match-main">

          <div className="profile-match-kda">

            <strong>
              {
                match.kills
              }
              {" / "}
              {
                match.deaths
              }
              {" / "}
              {
                match.assists
              }
            </strong>

            <span>
              {
                match.rating
              } 평점
            </span>

          </div>


          <div className="profile-match-stats">

            <span>
              라인전{" "}
              {
                match.laneScore
              }
              :
              {
                100 -
                match.laneScore
              }
            </span>

            <span>
              킬관여{" "}
              {
                match.killParticipation
              }%
            </span>

            <span>
              CS{" "}
              {
                match.cs
              } (
              {
                match.csPerMinute
              }
              )
            </span>

          </div>


          <div className="profile-match-items">

            {match.items.map(
              (
                image,
                index
              ) => (
                <img
                  key={index}
                  src={image}
                  alt=""
                />
              )
            )}

            <img
              src={
                match.trinket
              }
              alt=""
            />

          </div>

        </div>


        <div className="profile-match-players">

          <PlayerMiniList
            players={
              match.allies
            }
          />

          <PlayerMiniList
            players={
              match.enemies
            }
          />

        </div>


        <button
          type="button"
          className="profile-match-toggle"
          onClick={() =>
            setOpen(
              (value) =>
                !value
            )
          }
        >
          {
            open
              ? "⌃"
              : "⌄"
          }
        </button>

      </div>


      {open && (
        <MatchDetail
          match={
            match
          }
        />
      )}

    </article>
  );
}


export default function ProfileMatchHistory({
  matches,
}: Props) {
  return (
    <section className="profile-result-history">

      <div className="profile-result-tabs">

        <button
          type="button"
          className="active"
        >
          전체전적
        </button>

        <button type="button">
          내전전적
        </button>

        <button type="button">
          솔로랭크 전적
        </button>

      </div>


      <div className="profile-match-list">

        {matches.map(
          (
            match,
            index
          ) => (
            <MatchCard
              key={
                match.id
              }
              match={
                match
              }
              defaultOpen={
                index === 0
              }
            />
          )
        )}

      </div>

    </section>
  );
}